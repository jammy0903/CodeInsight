/**
 * C GDB Client
 *
 * Uses shared GDB Engine with C-specific variable enrichment:
 *   - struct member extraction (ptype → field queries)
 *   - char array element extraction (char [N] → individual chars)
 *   - dangling pointer detection (dereference failure)
 */

import {
  GdbEngine,
  type GdbVariable,
  type GdbSnapshot,
  type VariableEnricher,
  type CommandSender,
  type ResponseWaiter,
  parseMiValue,
} from '../../shared/gdb';

// Re-export shared types for C usage
export type { GdbSnapshot, GdbVariable, GdbStackFrame, GdbHeapBlock } from '../../shared/gdb';

// ============================================
// C Variable Enricher
// ============================================

class CVariableEnricher implements VariableEnricher {
  async enrich(
    v: GdbVariable,
    send: CommandSender,
    wait: ResponseWaiter,
  ): Promise<void> {
    // Struct member extraction: detect struct types and query fields
    if (this.isStructType(v.type) && !v.type.includes('*')) {
      await this.enrichStruct(v, send, wait);
    }

    // Char array: detect char [N] and extract individual elements
    if (this.isCharArray(v.type)) {
      await this.enrichCharArray(v, send, wait);
    }

    // Dangling pointer detection: if pointer, try dereference
    if (v.type.includes('*') && v.points_to) {
      await this.checkDangling(v, send, wait);
    }
  }

  private isStructType(type: string): boolean {
    // Match "struct Foo" or types that look like user-defined (not basic C types)
    if (type.startsWith('struct ')) return true;
    // Exclude basic C types
    const basicTypes = [
      'int', 'float', 'double', 'char', 'short', 'long',
      'unsigned int', 'unsigned char', 'unsigned short', 'unsigned long',
      'long long', 'unsigned long long', 'long double',
      'void', '_Bool', 'size_t',
    ];
    return !basicTypes.includes(type) && !type.includes('*') && !type.includes('[');
  }

  private isCharArray(type: string): boolean {
    return /^char\s*\[\d+\]$/.test(type);
  }

  private async enrichStruct(
    v: GdbVariable,
    send: CommandSender,
    wait: ResponseWaiter,
  ): Promise<void> {
    try {
      // Use ptype to get struct member list
      send(`-data-evaluate-expression "sizeof(${v.name})"`);
      await wait(); // just to verify it's a valid expression

      // Parse struct fields using ptype
      send(`ptype ${v.name}`);
      const ptypeLines = await wait();
      const ptypeOutput = ptypeLines.join('\n');

      // Parse members from ptype output like:
      // ~"type = struct Point {\n"
      // ~"    int x;\n"
      // ~"    int y;\n"
      // ~"}\n"
      const members: Array<{ name: string; type: string; value: string }> = [];
      const memberRegex = /~"\\?\s+(\w[\w\s*]*?)\s+(\w+);\s*\\?n?"/g;
      let match;
      while ((match = memberRegex.exec(ptypeOutput)) !== null) {
        const memberType = match[1].trim();
        const memberName = match[2];

        // Query each member's value
        send(`-data-evaluate-expression "${v.name}.${memberName}"`);
        const valLines = await wait();
        const valOutput = valLines.join('\n');
        const memberValue = parseMiValue(valOutput) || '?';

        members.push({ name: memberName, type: memberType, value: memberValue });
      }

      if (members.length > 0) {
        v.structMembers = members;
      }
    } catch {
      // Struct introspection failed — continue
    }
  }

  private async enrichCharArray(
    v: GdbVariable,
    send: CommandSender,
    wait: ResponseWaiter,
  ): Promise<void> {
    try {
      // Extract array size from type like "char [20]"
      const sizeMatch = v.type.match(/\[(\d+)\]/);
      if (!sizeMatch) return;
      const size = parseInt(sizeMatch[1], 10);

      const elements: string[] = [];
      // Read up to 64 elements or until null terminator
      const limit = Math.min(size, 64);
      for (let i = 0; i < limit; i++) {
        send(`-data-evaluate-expression "${v.name}[${i}]"`);
        const elLines = await wait();
        const elOutput = elLines.join('\n');
        const elMatch = elOutput.match(/value="(\d+)\s+'([^']*)'/);
        if (elMatch) {
          const charCode = parseInt(elMatch[1], 10);
          if (charCode === 0) break; // null terminator
          elements.push(elMatch[2]);
        } else {
          // Try simple numeric value
          const numMatch = elOutput.match(/value="(\d+)"/);
          if (numMatch) {
            const charCode = parseInt(numMatch[1], 10);
            if (charCode === 0) break;
            elements.push(String.fromCharCode(charCode));
          }
        }
      }

      if (elements.length > 0) {
        v.charElements = elements;
      }
    } catch {
      // Char array introspection failed — continue
    }
  }

  private async checkDangling(
    v: GdbVariable,
    send: CommandSender,
    wait: ResponseWaiter,
  ): Promise<void> {
    try {
      send(`-data-evaluate-expression "*(${v.name})"`);
      const derefLines = await wait();
      const derefOutput = derefLines.join('\n');

      // If GDB reports error accessing memory, pointer is dangling
      if (
        derefOutput.includes('^error') ||
        derefOutput.includes('Cannot access memory') ||
        derefOutput.includes('cannot access memory')
      ) {
        v.dangling = true;
      }
    } catch {
      v.dangling = true;
    }
  }
}

// ============================================
// C GDB Client
// ============================================

export class CGdbClient {
  async run(
    projectPath: string,
    sourceLines: string[],
    redirectLineSkips: number = 1,
  ): Promise<GdbSnapshot[]> {
    const engine = new GdbEngine({
      sourceFileName: 'main.c',
      timeout: 15_000,
      maxSteps: 500,
      redirectLineSkips,
    });
    return engine.run(projectPath, sourceLines, new CVariableEnricher());
  }
}
