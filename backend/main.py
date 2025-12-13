"""
COSLAB Backend - C 코드 메모리 트레이서 API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tracer import trace_code

app = FastAPI(
    title="COSLAB API",
    description="C 코드 실행 및 메모리 트레이싱",
    version="1.0.0"
)

# CORS 설정 (프론트엔드 연동용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에선 특정 도메인만
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TraceRequest(BaseModel):
    code: str
    timeout: int = 10

class TraceResponse(BaseModel):
    success: bool
    steps: list = []
    error: str = ""
    message: str = ""

    class Config:
        arbitrary_types_allowed = True

@app.get("/")
def root():
    return {"status": "ok", "service": "COSLAB Tracer API"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/api/trace", response_model=TraceResponse)
def trace(request: TraceRequest):
    """
    C 코드를 실행하고 각 스텝의 메모리 상태를 반환

    - **code**: C 소스 코드
    - **timeout**: 최대 실행 시간 (초)

    Returns:
        각 실행 스텝의 메모리 상태 (스택, 힙, 변수 값)
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="코드가 비어있습니다")

    # 기본 보안 체크 (더 강화 필요)
    dangerous_patterns = [
        "system(", "exec(", "popen(", "fork(",
        "unlink(", "remove(", "rmdir(",
        "#include <sys/", "asm(", "__asm__"
    ]

    for pattern in dangerous_patterns:
        if pattern in request.code:
            raise HTTPException(
                status_code=400,
                detail=f"보안상 허용되지 않는 코드: {pattern}"
            )

    result = trace_code(request.code, timeout=min(request.timeout, 30))

    return TraceResponse(
        success=result.get("success", False),
        steps=result.get("steps", []),
        error=result.get("error", ""),
        message=result.get("message", "")
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
