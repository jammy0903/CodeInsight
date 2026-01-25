#!/usr/bin/env python3
"""
Python Debugger Agent using sys.settrace()

This agent captures execution snapshots at each line of Python code execution,
producing JSON output compatible with the Java JDI-based simulator format.

Output format (one JSON per line):
{
    "line": int,
    "event": "STEP",
    "stack": [
        {
            "methodName": str,
            "className": str,
            "variables": { name: value }
        }
    ],
    "heap": [
        {
            "address": str ("0xNNN"),
            "type": str,
            "content": str,
            "length": int (for lists/tuples)
        }
    ]
}
"""

import sys
import json
import os


class DebuggerAgent:
    def __init__(self, target_file: str):
        self.target_file = target_file
        self.collected_ids = set()
        self.heap_objects = []
        self.object_id_counter = 1
        self.id_map = {}  # Maps Python id() to our hex address
        self.stdout_buffer = []
        self.last_line = -1  # Track last line to avoid duplicate snapshots
        self.pending_frame = None  # Frame from previous line (to capture AFTER execution)
        self.pending_line = -1

    def get_hex_address(self, obj) -> str:
        """Get or create a hex address for an object."""
        obj_id = id(obj)
        if obj_id not in self.id_map:
            self.id_map[obj_id] = f"0x{self.object_id_counter:03X}"
            self.object_id_counter += 1
        return self.id_map[obj_id]

    def trace_func(self, frame, event, arg):
        """Trace function called by sys.settrace() for each execution event."""
        # Only trace 'line' events (before each line executes)
        if event != 'line':
            return self.trace_func

        # Only trace the target file
        filename = frame.f_code.co_filename
        if filename != self.target_file and filename != '<string>':
            return self.trace_func

        line_number = frame.f_lineno

        # Output the PREVIOUS line's state (after it executed)
        # This way we capture the state AFTER the line ran
        if self.pending_line > 0:
            snapshot = self.capture(frame, self.pending_line)
            print(json.dumps(snapshot, ensure_ascii=False))
            sys.stdout.flush()

        # Store current line as pending (will output on next line event)
        self.pending_frame = frame
        self.pending_line = line_number

        return self.trace_func

    def flush_pending(self, frame):
        """Output the last pending line's state."""
        if self.pending_line > 0 and frame:
            snapshot = self.capture(frame, self.pending_line)
            print(json.dumps(snapshot, ensure_ascii=False))
            sys.stdout.flush()
            self.pending_line = -1

    def capture(self, frame, line_number: int) -> dict:
        """Capture the current execution state."""
        # Reset heap collection for this snapshot
        self.collected_ids = set()
        self.heap_objects = []

        return {
            "line": line_number,
            "event": "STEP",
            "stack": self._build_stack(frame),
            "heap": self.heap_objects
        }

    def _build_stack(self, frame) -> list:
        """Build the call stack from the current frame."""
        frames = []
        current_frame = frame

        while current_frame is not None:
            code = current_frame.f_code
            filename = code.co_filename

            # Only include frames from our target file
            if filename == self.target_file or filename == '<string>':
                frame_data = {
                    "methodName": code.co_name if code.co_name != '<module>' else "main",
                    "className": "Main",
                    "variables": self._extract_variables(current_frame.f_locals)
                }
                frames.append(frame_data)

            current_frame = current_frame.f_back

        return frames

    def _extract_variables(self, locals_dict: dict) -> dict:
        """Extract variables from a local namespace."""
        variables = {}

        for name, value in locals_dict.items():
            # Skip internal variables and modules
            if name.startswith('_'):
                continue
            if isinstance(value, type(sys)):  # Skip modules
                continue
            if callable(value) and not isinstance(value, type):  # Skip functions but keep classes
                # Check if it's a user-defined function (not built-in)
                if hasattr(value, '__module__') and value.__module__ == '__main__':
                    variables[name] = self._parse_value(value)
                continue

            variables[name] = self._parse_value(value)

        return variables

    def _parse_value(self, value):
        """Parse a Python value into the snapshot format."""
        # None
        if value is None:
            return None

        # Booleans (must check before int since bool is subclass of int)
        if isinstance(value, bool):
            return value

        # Numbers (int, float)
        if isinstance(value, (int, float)):
            return value

        # Strings -> heap reference
        if isinstance(value, str):
            return self._add_string_to_heap(value)

        # Lists -> heap reference
        if isinstance(value, list):
            return self._add_list_to_heap(value)

        # Tuples -> heap reference
        if isinstance(value, tuple):
            return self._add_tuple_to_heap(value)

        # Dicts -> heap reference
        if isinstance(value, dict):
            return self._add_dict_to_heap(value)

        # Sets -> heap reference
        if isinstance(value, (set, frozenset)):
            return self._add_set_to_heap(value)

        # Classes (type objects)
        if isinstance(value, type):
            return self._add_class_to_heap(value)

        # Functions
        if callable(value) and hasattr(value, '__name__'):
            return self._add_function_to_heap(value)

        # Custom objects -> heap reference
        if hasattr(value, '__dict__'):
            return self._add_object_to_heap(value)

        # Fallback: convert to string
        return str(value)

    def _add_string_to_heap(self, value: str) -> dict:
        """Add a string to the heap and return a reference."""
        address = self.get_hex_address(value)
        obj_id = id(value)

        if obj_id not in self.collected_ids:
            self.collected_ids.add(obj_id)
            self.heap_objects.append({
                "address": address,
                "type": "str",
                "content": f'"{value}"'
            })

        return {
            "type": "Reference",
            "id": address,
            "class": "str",
            "displayValue": value
        }

    def _add_list_to_heap(self, value: list) -> dict:
        """Add a list to the heap and return a reference."""
        address = self.get_hex_address(value)
        obj_id = id(value)

        if obj_id not in self.collected_ids:
            self.collected_ids.add(obj_id)
            self.heap_objects.append({
                "address": address,
                "type": "list",
                "content": self._format_sequence_content(value),
                "length": len(value)
            })

        return {
            "type": "Array",
            "id": address,
            "class": "list",
            "length": len(value)
        }

    def _add_tuple_to_heap(self, value: tuple) -> dict:
        """Add a tuple to the heap and return a reference."""
        address = self.get_hex_address(value)
        obj_id = id(value)

        if obj_id not in self.collected_ids:
            self.collected_ids.add(obj_id)
            self.heap_objects.append({
                "address": address,
                "type": "tuple",
                "content": self._format_sequence_content(value),
                "length": len(value)
            })

        return {
            "type": "Array",
            "id": address,
            "class": "tuple",
            "length": len(value)
        }

    def _add_dict_to_heap(self, value: dict) -> dict:
        """Add a dict to the heap and return a reference."""
        address = self.get_hex_address(value)
        obj_id = id(value)

        if obj_id not in self.collected_ids:
            self.collected_ids.add(obj_id)
            self.heap_objects.append({
                "address": address,
                "type": "dict",
                "content": self._format_dict_content(value),
                "length": len(value)
            })

        return {
            "type": "Reference",
            "id": address,
            "class": "dict",
            "length": len(value)
        }

    def _add_set_to_heap(self, value) -> dict:
        """Add a set to the heap and return a reference."""
        address = self.get_hex_address(value)
        obj_id = id(value)
        type_name = "set" if isinstance(value, set) else "frozenset"

        if obj_id not in self.collected_ids:
            self.collected_ids.add(obj_id)
            self.heap_objects.append({
                "address": address,
                "type": type_name,
                "content": self._format_set_content(value),
                "length": len(value)
            })

        return {
            "type": "Reference",
            "id": address,
            "class": type_name,
            "length": len(value)
        }

    def _add_class_to_heap(self, value: type) -> dict:
        """Add a class to the heap and return a reference."""
        address = self.get_hex_address(value)
        obj_id = id(value)

        if obj_id not in self.collected_ids:
            self.collected_ids.add(obj_id)
            self.heap_objects.append({
                "address": address,
                "type": "class",
                "content": f"<class '{value.__name__}'>"
            })

        return {
            "type": "Reference",
            "id": address,
            "class": "type",
            "displayValue": value.__name__
        }

    def _add_function_to_heap(self, value) -> dict:
        """Add a function to the heap and return a reference."""
        address = self.get_hex_address(value)
        obj_id = id(value)

        if obj_id not in self.collected_ids:
            self.collected_ids.add(obj_id)
            self.heap_objects.append({
                "address": address,
                "type": "function",
                "content": f"<function {value.__name__}>"
            })

        return {
            "type": "Reference",
            "id": address,
            "class": "function",
            "displayValue": value.__name__
        }

    def _add_object_to_heap(self, value) -> dict:
        """Add a custom object to the heap and return a reference."""
        address = self.get_hex_address(value)
        obj_id = id(value)
        class_name = type(value).__name__

        if obj_id not in self.collected_ids:
            self.collected_ids.add(obj_id)
            self.heap_objects.append({
                "address": address,
                "type": class_name,
                "content": self._format_object_content(value)
            })

        return {
            "type": "Reference",
            "id": address,
            "class": class_name
        }

    def _format_sequence_content(self, seq) -> str:
        """Format a sequence (list/tuple) for display."""
        if not seq:
            return "[]" if isinstance(seq, list) else "()"

        items = []
        limit = min(len(seq), 5)

        for i in range(limit):
            items.append(self._format_value_short(seq[i]))

        if len(seq) > limit:
            items.append("...")

        brackets = "[]" if isinstance(seq, list) else "()"
        return f"{brackets[0]}{', '.join(items)}{brackets[1]}"

    def _format_dict_content(self, d: dict) -> str:
        """Format a dict for display."""
        if not d:
            return "{}"

        items = []
        limit = 3

        for i, (k, v) in enumerate(d.items()):
            if i >= limit:
                items.append("...")
                break
            items.append(f"{self._format_value_short(k)}: {self._format_value_short(v)}")

        return "{" + ", ".join(items) + "}"

    def _format_set_content(self, s) -> str:
        """Format a set for display."""
        if not s:
            return "set()"

        items = []
        limit = 3

        for i, v in enumerate(s):
            if i >= limit:
                items.append("...")
                break
            items.append(self._format_value_short(v))

        return "{" + ", ".join(items) + "}"

    def _format_object_content(self, obj) -> str:
        """Format a custom object for display."""
        class_name = type(obj).__name__

        try:
            attrs = vars(obj)
            if not attrs:
                return f"{class_name}{{}}"

            items = []
            limit = 3

            for i, (k, v) in enumerate(attrs.items()):
                if i >= limit:
                    items.append("...")
                    break
                if not k.startswith('_'):
                    items.append(f"{k}={self._format_value_short(v)}")

            return f"{class_name}{{{', '.join(items)}}}"
        except:
            return f"{class_name}{{...}}"

    def _format_value_short(self, value) -> str:
        """Format a value for short display (in content strings)."""
        if value is None:
            return "None"
        if isinstance(value, bool):
            return str(value)
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, str):
            if len(value) > 10:
                return f'"{value[:10]}..."'
            return f'"{value}"'
        if isinstance(value, (list, tuple)):
            return f"[...{len(value)}]" if isinstance(value, list) else f"(...{len(value)})"
        if isinstance(value, dict):
            return f"{{...{len(value)}}}"
        if isinstance(value, (set, frozenset)):
            return f"{{...{len(value)}}}"
        if hasattr(value, '__dict__'):
            return f"@{self.get_hex_address(value)}"
        return str(value)[:20]


def run_with_trace(code: str, target_file: str):
    """Run the code with tracing enabled."""
    agent = DebuggerAgent(target_file)

    # Set the trace function
    sys.settrace(agent.trace_func)

    last_frame = None
    try:
        # Create a clean namespace for execution
        namespace = {
            '__name__': '__main__',
            '__file__': target_file,
            '__builtins__': __builtins__,
        }

        # Execute the code
        exec(compile(code, target_file, 'exec'), namespace)

        # Flush the last pending line after successful execution
        # Create a dummy frame-like object with the final namespace
        class FinalFrame:
            def __init__(self, ns):
                self.f_locals = ns
                self.f_back = None
                self.f_code = type('code', (), {'co_name': '<module>', 'co_filename': target_file})()

        agent.flush_pending(FinalFrame(namespace))

    except Exception as e:
        # Output error as a special snapshot
        error_snapshot = {
            "line": agent.pending_line if agent.pending_line > 0 else 1,
            "event": "ERROR",
            "error": {
                "type": type(e).__name__,
                "message": str(e)
            },
            "stack": [],
            "heap": []
        }
        print(json.dumps(error_snapshot, ensure_ascii=False))
        sys.stdout.flush()

    finally:
        sys.settrace(None)


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
