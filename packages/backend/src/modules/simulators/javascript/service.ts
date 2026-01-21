import { JsStep, JsStackFrame } from './types';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import { Expression, Identifier, VariableDeclarator } from '@babel/types';

interface SimulationResult {
  steps: JsStep[];
  source_lines: string[];
}

class JavaScriptSimulator {
  private steps: JsStep[] = [];
  private source_lines: string[];
  private globalScope: Record<string, any> = {};

  constructor(code: string) {
    this.source_lines = code.split('\n');
    this.addStep(0, '시뮬레이션 시작');
  }

  private addStep(line: number, explanation: string) {
    // Deep copy of the current state
    const stack: JsStackFrame[] = [
      {
        functionName: '(global)',
        variables: JSON.parse(JSON.stringify(this.globalScope)),
      },
    ];

    this.steps.push({
      line,
      code: this.source_lines[line - 1] || '',
      explanation,
      stack,
      heap: [], // Heap not implemented yet
    });
  }

  private evaluateExpression(expr: Expression | null): any {
    if (!expr) return undefined;

    switch (expr.type) {
      case 'NumericLiteral':
      case 'StringLiteral':
      case 'BooleanLiteral':
        return expr.value;
      case 'Identifier':
        return this.globalScope[expr.name];
      // TODO: Add more expression types
      default:
        return undefined;
    }
  }

  run(): SimulationResult {
    const ast = parser.parse(this.source_lines.join('\n'), {
      sourceType: 'module',
      errorRecovery: true,
    });

    traverse(ast, {
      VariableDeclarator: (path) => {
        const declarator = path.node;
        if (declarator.id.type === 'Identifier') {
          const varName = declarator.id.name;
          const value = this.evaluateExpression(declarator.init);
          this.globalScope[varName] = value;

          const line = declarator.loc?.start.line ?? 0;
          this.addStep(line, `변수 '${varName}' 선언 및 값 '${value}' 할당.`);
        }
      },
      AssignmentExpression: (path) => {
        const assignment = path.node;
        if (assignment.left.type === 'Identifier') {
          const varName = assignment.left.name;
          const value = this.evaluateExpression(assignment.right);
          this.globalScope[varName] = value;

          const line = assignment.loc?.start.line ?? 0;
          this.addStep(line, `변수 '${varName}'에 값 '${value}' 할당.`);
        }
      },
    });

    return { steps: this.steps, source_lines: this.source_lines };
  }
}

export async function simulate(code: string): Promise<SimulationResult> {
  const simulator = new JavaScriptSimulator(code);
  return simulator.run();
}
