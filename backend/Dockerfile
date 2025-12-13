FROM python:3.11-slim

# GCC, GDB 설치
RUN apt-get update && apt-get install -y \
    gcc \
    gdb \
    curl \
    && rm -rf /var/lib/apt/lists/*

# GDB가 ptrace 사용 가능하도록 설정
RUN echo "kernel.yama.ptrace_scope = 0" >> /etc/sysctl.conf || true

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 복사
COPY . .

# 포트
EXPOSE 8000

# 실행 (root로 실행해야 GDB ptrace 가능)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
