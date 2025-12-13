"""
GDB 기반 C 코드 메모리 트레이서 v2
- 실제 메모리 주소
- 바이트 단위 값
- 포인터 추적
"""

import subprocess
import tempfile
import os
import re
import json
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict, field

@dataclass
class MemoryBlock:
    name: str
    address: str
    type: str
    size: int
    bytes: List[int]
    value: str
    points_to: Optional[str] = None  # 포인터가 가리키는 주소

@dataclass
class Step:
    line: int
    code: str
    stack: List[MemoryBlock]
    heap: List[MemoryBlock]
    rsp: str = ""  # 스택 포인터
    rbp: str = ""  # 베이스 포인터

def trace_code(code: str, timeout: int = 10) -> Dict[str, Any]:
    """C 코드 실행하고 각 스텝의 메모리 상태 반환"""

    with tempfile.TemporaryDirectory() as tmpdir:
        src_path = os.path.join(tmpdir, "main.c")
        bin_path = os.path.join(tmpdir, "main")

        # 소스 저장
        with open(src_path, "w") as f:
            f.write(code)

        # 컴파일 (디버그 심볼 + 최적화 끔)
        compile_result = subprocess.run(
            ["gcc", "-g", "-O0", "-o", bin_path, src_path],
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if compile_result.returncode != 0:
            return {
                "success": False,
                "error": "compile_error",
                "message": compile_result.stderr
            }

        # GDB 실행
        try:
            gdb_output = run_gdb_trace(bin_path, code, timeout)
            steps = parse_gdb_output(gdb_output, code)

            return {
                "success": True,
                "steps": [asdict(s) for s in steps],
                "source_lines": code.strip().split('\n')
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "timeout",
                "message": f"실행 시간 초과 ({timeout}초)"
            }
        except Exception as e:
            return {
                "success": False,
                "error": "gdb_error",
                "message": str(e)
            }

def run_gdb_trace(bin_path: str, code: str, timeout: int) -> str:
    """GDB로 프로그램 추적"""

    # 실행할 줄 수 계산
    num_lines = len([l for l in code.split('\n') if l.strip()])

    gdb_commands = f"""
set pagination off
set print pretty off
set confirm off

# main에서 시작
break main
run

# 각 스텝마다 정보 출력
"""

    for i in range(num_lines + 10):
        gdb_commands += f"""
echo \\n###STEP###\\n
echo LINE:
frame
echo VARS:
info locals
echo ADDRS:
info address
"""
        # 각 지역변수의 주소와 값을 바이트로 출력
        gdb_commands += """
python
import gdb
try:
    frame = gdb.selected_frame()
    block = frame.block()
    for symbol in block:
        if symbol.is_variable:
            name = symbol.name
            try:
                val = frame.read_var(symbol)
                addr = val.address
                t = val.type
                size = t.sizeof
                if addr:
                    print(f"VAR:{name}|ADDR:{addr}|TYPE:{t}|SIZE:{size}")
                    # 바이트 읽기
                    inferior = gdb.selected_inferior()
                    mem = inferior.read_memory(addr, size)
                    bytes_hex = ' '.join(f'{b:02x}' for b in mem)
                    print(f"BYTES:{bytes_hex}")
                    # 포인터면 가리키는 주소
                    if t.code == gdb.TYPE_CODE_PTR:
                        print(f"POINTS_TO:{val}")
            except:
                pass
except:
    pass
end
echo REGS:
info registers rsp rbp
next
"""

    gdb_commands += "\nquit\n"

    result = subprocess.run(
        ["gdb", "-batch", "-x", "/dev/stdin", bin_path],
        input=gdb_commands,
        capture_output=True,
        text=True,
        timeout=timeout
    )

    return result.stdout

def parse_gdb_output(output: str, code: str) -> List[Step]:
    """GDB 출력 파싱"""
    steps = []
    code_lines = code.strip().split('\n')

    # ###STEP### 으로 분리
    step_blocks = output.split('###STEP###')

    for block in step_blocks[1:]:  # 첫 번째는 헤더
        if 'Inferior' in block and 'exited' in block:
            continue

        step = parse_step_block(block, code_lines)
        if step:
            steps.append(step)

    return steps

def parse_step_block(block: str, code_lines: List[str]) -> Optional[Step]:
    """스텝 블록 파싱"""

    # 현재 라인 번호
    line_match = re.search(r'(\d+)\s+', block)
    if not line_match:
        return None

    line_num = int(line_match.group(1))
    code = code_lines[line_num - 1] if 0 < line_num <= len(code_lines) else ""

    # 변수들 파싱
    stack = []
    var_pattern = r'VAR:(\w+)\|ADDR:(0x[0-9a-f]+)\|TYPE:([^|]+)\|SIZE:(\d+)'
    bytes_pattern = r'BYTES:([0-9a-f ]+)'
    points_pattern = r'POINTS_TO:(0x[0-9a-f]+)'

    var_matches = list(re.finditer(var_pattern, block))

    for i, match in enumerate(var_matches):
        name = match.group(1)
        addr = match.group(2)
        var_type = match.group(3).strip()
        size = int(match.group(4))

        # 바이트 찾기 (이 VAR 다음에 나오는 BYTES)
        remaining = block[match.end():]
        bytes_match = re.search(bytes_pattern, remaining)

        if bytes_match:
            hex_str = bytes_match.group(1)
            bytes_list = [int(b, 16) for b in hex_str.split()]
        else:
            bytes_list = [0] * size

        # 포인터면 가리키는 주소
        points_to = None
        if '*' in var_type:
            points_match = re.search(points_pattern, remaining)
            if points_match:
                points_to = points_match.group(1)

        # 값 계산 (리틀 엔디안)
        if size <= 8 and bytes_list:
            int_val = int.from_bytes(bytes(bytes_list[:8]), byteorder='little', signed=True)
            value = str(int_val)
        else:
            value = "..."

        stack.append(MemoryBlock(
            name=name,
            address=addr,
            type=var_type,
            size=size,
            bytes=bytes_list,
            value=value,
            points_to=points_to
        ))

    # RSP, RBP
    rsp = ""
    rbp = ""
    rsp_match = re.search(r'rsp\s+(0x[0-9a-f]+)', block)
    rbp_match = re.search(r'rbp\s+(0x[0-9a-f]+)', block)
    if rsp_match:
        rsp = rsp_match.group(1)
    if rbp_match:
        rbp = rbp_match.group(1)

    return Step(
        line=line_num,
        code=code.strip(),
        stack=stack,
        heap=[],  # malloc 추적은 별도 구현 필요
        rsp=rsp,
        rbp=rbp
    )

# 테스트
if __name__ == "__main__":
    test_code = """
#include <stdio.h>

int main() {
    int x = 5;
    int y = 10;
    int *p = &x;
    *p = 20;
    return 0;
}
"""
    result = trace_code(test_code)
    print(json.dumps(result, indent=2, ensure_ascii=False))
