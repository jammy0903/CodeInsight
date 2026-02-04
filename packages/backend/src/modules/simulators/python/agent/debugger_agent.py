#!/usr/bin/env python3
"""
Python Debugger Agent using sys.settrace()

Captures execution snapshots at each line, producing JSON output in
names/objects/callStack format (matching Lesson JSON structure).

Output format (one JSON per line):
{
    "line": int,
    "event": "STEP",
    "names": [
        {"name": str, "scope": str, "pointsTo": str}
    ],
    "objects": [
        {"id": str, "type": str, "value": any, "mutable": bool}
    ],
    "callStack": [
        {"functionName": str, "depth": int, "localNames": [...]}
    ],
    "stdout": str (optional)
}
"""

import sys
import json
import os
import io
import inspect


# 원본 stdout 저장 (JSON 스냅샷 출력용)
_original_stdout = sys.stdout

# 불변 타입 집합
_IMMUTABLE_TYPES = frozenset({"int", "float", "str", "bool", "NoneType", "tuple", "frozenset"})

# 컬렉션 원소 제한
_MAX_COLLECTION_ITEMS = 50


class StdoutCapture:
    """사용자 print 출력을 캡처하는 클래스"""
    def __init__(self):
        self.buffer = io.StringIO()

    def write(self, text):
        self.buffer.write(text)

    def flush(self):
        pass

    def getvalue(self):
        return self.buffer.getvalue()

    def clear(self):
        self.buffer = io.StringIO()


class DebuggerAgent:
    def __init__(self, target_file: str, stdout_capture: StdoutCapture):
        self.target_file = target_file
        self.stdout_capture = stdout_capture
        self.object_id_counter = 1
        self.id_map = {}  # Python id() → hex address
        # Per-snapshot state (reset each capture)
        self.collected_ids = set()
        self.objects_list = []
        # Pending line state
        self.pending_frame = None
        self.pending_line = -1

    def get_hex_address(self, obj) -> str:
        """Get or create a stable hex address for an object."""
        obj_id = id(obj)
        if obj_id not in self.id_map:
            self.id_map[obj_id] = f"0x{self.object_id_counter:03X}"
            self.object_id_counter += 1
        return self.id_map[obj_id]

    def trace_func(self, frame, event, arg):
        """sys.settrace() callback."""
        # On 'call': decide whether to trace this frame
        if event == 'call':
            filename = frame.f_code.co_filename
            if filename != self.target_file and filename != '<string>':
                return None  # Don't trace non-user frames
            co = frame.f_code
            # Skip class body frames: 0 args, not module, name matches first const
            if (co.co_name != '<module>' and co.co_argcount == 0
                    and len(co.co_consts) > 0 and co.co_consts[0] == co.co_name):
                return None  # Don't trace class body execution
            return self.trace_func

        if event != 'line':
            return self.trace_func

        filename = frame.f_code.co_filename
        if filename != self.target_file and filename != '<string>':
            return self.trace_func

        # Output PREVIOUS line's state (captured AFTER execution)
        if self.pending_line > 0:
            snapshot = self._capture(frame, self.pending_line)
            _original_stdout.write(json.dumps(snapshot, ensure_ascii=False) + '\n')
            _original_stdout.flush()

        self.pending_frame = frame
        self.pending_line = frame.f_lineno

        return self.trace_func

    def flush_pending(self, frame):
        """Output the last pending line's state."""
        if self.pending_line > 0 and frame:
            snapshot = self._capture(frame, self.pending_line)
            _original_stdout.write(json.dumps(snapshot, ensure_ascii=False) + '\n')
            _original_stdout.flush()
            self.pending_line = -1

    # ─── Snapshot Capture ────────────────────────────────────────

    def _capture(self, frame, line_number: int) -> dict:
        """Capture current execution state as names/objects/callStack."""
        # Reset per-snapshot state
        self.collected_ids = set()
        self.objects_list = []

        # Capture stdout for this step
        stdout_value = self.stdout_capture.getvalue()
        self.stdout_capture.clear()

        # Walk the call stack (innermost → outermost)
        raw_frames = self._collect_frames(frame)

        # Build names, objects, callStack from frames
        all_names = []
        call_stack = []

        for i, frame_info in enumerate(raw_frames):
            func_name = frame_info["functionName"]
            is_global = (func_name == "__main__")
            scope = "global" if is_global else func_name
            local_names_for_callstack = []

            for var_name, var_value in frame_info["variables"].items():
                obj_id = self._ensure_object(var_value)
                name_entry = {
                    "name": var_name,
                    "scope": scope,
                    "pointsTo": obj_id,
                }
                all_names.append(name_entry)
                if not is_global:
                    local_names_for_callstack.append({
                        "name": var_name,
                        "pointsTo": obj_id,
                    })

            if not is_global:
                call_stack.append({
                    "functionName": func_name,
                    "depth": frame_info["depth"],
                    "localNames": local_names_for_callstack,
                })

        snapshot = {
            "line": line_number,
            "event": "STEP",
            "names": all_names,
            "objects": self.objects_list,
            "callStack": call_stack,
        }

        if stdout_value:
            snapshot["stdout"] = stdout_value

        return snapshot

    def _collect_frames(self, frame) -> list:
        """Walk call stack and collect frame info (outermost first)."""
        frames = []
        current = frame
        depth = 0

        while current is not None:
            filename = current.f_code.co_filename
            if filename == self.target_file or filename == '<string>':
                func_name = current.f_code.co_name

                if func_name == '<module>':
                    func_name = "__main__"

                frames.append({
                    "functionName": func_name,
                    "depth": depth,
                    "variables": self._extract_variables(current.f_locals),
                })
                depth += 1

            current = current.f_back

        # Reverse: outermost (global) first, innermost (current function) last
        frames.reverse()
        # Re-assign depths: 0 = global, 1 = first call, etc.
        for i, f in enumerate(frames):
            f["depth"] = i

        return frames

    def _extract_variables(self, locals_dict: dict) -> dict:
        """Extract user variables from a frame's locals."""
        variables = {}

        for name, value in locals_dict.items():
            if name.startswith('_'):
                continue
            if isinstance(value, type(sys)):  # Skip modules
                continue
            if callable(value) and not isinstance(value, type):
                # Keep user-defined functions
                if hasattr(value, '__module__') and value.__module__ == '__main__':
                    variables[name] = value
                continue

            variables[name] = value

        return variables

    # ─── Object Tracking ─────────────────────────────────────────

    def _ensure_object(self, value) -> str:
        """
        Ensure a Python value is tracked in objects_list.
        Returns the hex address (object ID).
        Shared references: same id(value) → same hex → one object entry.
        """
        address = self.get_hex_address(value)
        obj_id = id(value)

        if obj_id in self.collected_ids:
            return address  # Already tracked this snapshot

        self.collected_ids.add(obj_id)

        # ── Primitives ──
        if value is None:
            self.objects_list.append({
                "id": address, "type": "NoneType",
                "value": None, "mutable": False,
            })
        elif isinstance(value, bool):
            self.objects_list.append({
                "id": address, "type": "bool",
                "value": value, "mutable": False,
            })
        elif isinstance(value, int):
            self.objects_list.append({
                "id": address, "type": "int",
                "value": value, "mutable": False,
            })
        elif isinstance(value, float):
            self.objects_list.append({
                "id": address, "type": "float",
                "value": value, "mutable": False,
            })
        elif isinstance(value, str):
            self.objects_list.append({
                "id": address, "type": "str",
                "value": value, "mutable": False,
            })

        # ── Sequences ──
        elif isinstance(value, list):
            # Recurse into elements first, then build objectId refs
            elements = []
            for item in value[:_MAX_COLLECTION_ITEMS]:
                elements.append({"objectId": self._ensure_object(item)})
            self.objects_list.append({
                "id": address, "type": "list",
                "value": elements, "mutable": True,
            })
        elif isinstance(value, tuple):
            elements = []
            for item in value[:_MAX_COLLECTION_ITEMS]:
                elements.append({"objectId": self._ensure_object(item)})
            self.objects_list.append({
                "id": address, "type": "tuple",
                "value": elements, "mutable": False,
            })

        # ── Dict ──
        elif isinstance(value, dict):
            entries = []
            for i, (k, v) in enumerate(value.items()):
                if i >= _MAX_COLLECTION_ITEMS:
                    break
                entries.append({
                    "key": {"objectId": self._ensure_object(k)},
                    "value": {"objectId": self._ensure_object(v)},
                })
            self.objects_list.append({
                "id": address, "type": "dict",
                "value": entries, "mutable": True,
            })

        # ── Set / Frozenset ──
        elif isinstance(value, (set, frozenset)):
            type_name = "set" if isinstance(value, set) else "frozenset"
            elements = []
            for i, item in enumerate(value):
                if i >= _MAX_COLLECTION_ITEMS:
                    break
                elements.append({"objectId": self._ensure_object(item)})
            self.objects_list.append({
                "id": address, "type": type_name,
                "value": elements,
                "mutable": isinstance(value, set),
            })

        # ── Class (type object) — must come before callable check ──
        elif isinstance(value, type):
            methods = {}
            for attr_name in dir(value):
                if not attr_name.startswith('_'):
                    attr = getattr(value, attr_name, None)
                    if callable(attr):
                        methods[attr_name] = self.get_hex_address(attr) if hasattr(attr, '__func__') else attr_name
            self.objects_list.append({
                "id": address, "type": "class",
                "value": {"name": value.__name__, "methods": methods},
                "mutable": False,
            })

        # ── Function ──
        elif callable(value) and hasattr(value, '__name__'):
            params = []
            try:
                sig = inspect.signature(value)
                params = [{"name": p} for p in sig.parameters]
            except (ValueError, TypeError):
                pass
            self.objects_list.append({
                "id": address, "type": "function",
                "value": {"name": value.__name__, "params": params},
                "mutable": False,
            })

        # ── Instance (custom object) ──
        elif hasattr(value, '__dict__'):
            class_name = type(value).__name__
            attributes = {}
            try:
                for k, v in vars(value).items():
                    if not k.startswith('_'):
                        attributes[k] = self._ensure_object(v)
            except Exception:
                pass
            self.objects_list.append({
                "id": address, "type": "instance",
                "value": {
                    "className": class_name,
                    "attributes": attributes,
                },
                "mutable": True,
            })

        # ── Fallback ──
        else:
            self.objects_list.append({
                "id": address, "type": type(value).__name__,
                "value": str(value), "mutable": False,
            })

        return address


def run_with_trace(code: str, target_file: str):
    """Run the code with tracing enabled."""
    stdout_capture = StdoutCapture()
    sys.stdout = stdout_capture

    agent = DebuggerAgent(target_file, stdout_capture)
    sys.settrace(agent.trace_func)

    try:
        namespace = {
            '__name__': '__main__',
            '__file__': target_file,
            '__builtins__': __builtins__,
        }

        exec(compile(code, target_file, 'exec'), namespace)

        # Flush the last pending line
        class FinalFrame:
            def __init__(self, ns):
                self.f_locals = ns
                self.f_back = None
                self.f_code = type('code', (), {
                    'co_name': '<module>',
                    'co_filename': target_file,
                })()

        agent.flush_pending(FinalFrame(namespace))

    except Exception as e:
        stdout_value = stdout_capture.getvalue()
        error_snapshot = {
            "line": agent.pending_line if agent.pending_line > 0 else 1,
            "event": "ERROR",
            "error": {
                "type": type(e).__name__,
                "message": str(e),
            },
            "names": [],
            "objects": [],
            "callStack": [],
        }
        if stdout_value:
            error_snapshot["stdout"] = stdout_value

        _original_stdout.write(json.dumps(error_snapshot, ensure_ascii=False) + '\n')
        _original_stdout.flush()

    finally:
        sys.settrace(None)
        sys.stdout = _original_stdout


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python debugger_agent.py <source_file>", file=sys.stderr)
        sys.exit(1)

    source_file = sys.argv[1]

    if not os.path.exists(source_file):
        print(f"Error: Source file not found: {source_file}", file=sys.stderr)
        sys.exit(1)

    with open(source_file, 'r', encoding='utf-8') as f:
        code = f.read()

    run_with_trace(code, source_file)
