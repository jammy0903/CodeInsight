#!/usr/bin/env python3
"""
Gmail 자동 답장 스크립트 (Claude API 사용)

필요한 환경 변수:
  GMAIL_ADDRESS       - Gmail 주소 (예: your@gmail.com)
  GMAIL_APP_PASSWORD  - Gmail 앱 비밀번호 (일반 비밀번호 X)
  ANTHROPIC_API_KEY   - Anthropic API 키

Gmail 앱 비밀번호 생성:
  https://myaccount.google.com/apppasswords

설치:
  pip install anthropic
"""

import imaplib
import smtplib
import email
import os
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import decode_header
import anthropic

# ── 설정 ──────────────────────────────────────────────────────────────────────
GMAIL_ADDRESS = os.environ.get("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

IMAP_HOST = "imap.gmail.com"
IMAP_PORT = 993
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

# 읽을 이메일 수 (최근 N개)
MAX_EMAILS = 10


# ── 유틸리티 ──────────────────────────────────────────────────────────────────
def decode_str(s: str) -> str:
    """이메일 헤더 문자열 디코딩"""
    if not s:
        return ""
    decoded_parts = decode_header(s)
    result = []
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            result.append(part.decode(encoding or "utf-8", errors="replace"))
        else:
            result.append(str(part))
    return "".join(result)


def extract_email_address(header: str) -> str:
    """From 헤더에서 이메일 주소만 추출"""
    if "<" in header and ">" in header:
        return header[header.index("<") + 1 : header.index(">")].strip()
    return header.strip()


def get_email_body(msg) -> str:
    """이메일 본문 추출 (text/plain 우선)"""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                disposition = str(part.get("Content-Disposition", ""))
                if "attachment" not in disposition:
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or "utf-8"
                        return payload.decode(charset, errors="replace")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            return payload.decode(charset, errors="replace")
    return ""


# ── Claude API ────────────────────────────────────────────────────────────────
def generate_reply(sender: str, subject: str, body: str) -> str:
    """Claude claude-opus-4-6로 답장 초안 생성"""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    stream = client.messages.stream(
        model="claude-opus-4-6",
        max_tokens=2048,
        thinking={"type": "adaptive"},
        system="""당신은 전문적이고 친절한 이메일 답장 작성 도우미입니다.
받은 이메일의 내용을 분석하고 적절하고 예의 바른 답장을 작성해주세요.

규칙:
- 답장 본문만 작성 (제목/주소 제외)
- 인사말과 작별 인사 포함
- 한국어 이메일 → 한국어 답장
- 영어 이메일 → 영어 답장
- 전문적이고 간결하게 작성
- 질문이 있으면 답변하고, 요청이 있으면 처리 방법 안내""",
        messages=[
            {
                "role": "user",
                "content": f"""다음 이메일에 대한 답장 초안을 작성해주세요:

보낸 사람: {sender}
제목: {subject}

이메일 내용:
{body[:3000]}

위 이메일에 대한 답장 본문만 작성해주세요.""",
            }
        ],
    )

    final = stream.get_final_message()
    for block in final.content:
        if block.type == "text":
            return block.text
    return ""


# ── 이메일 전송 ───────────────────────────────────────────────────────────────
def send_reply(to_address: str, subject: str, body: str):
    """SMTP로 답장 전송"""
    msg = MIMEMultipart()
    msg["From"] = GMAIL_ADDRESS
    msg["To"] = to_address
    msg["Subject"] = f"Re: {subject}" if not subject.lower().startswith("re:") else subject
    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_ADDRESS, to_address, msg.as_string())


# ── 메인 ─────────────────────────────────────────────────────────────────────
def process_emails():
    print("📬 Gmail IMAP 연결 중...")

    with imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT) as imap:
        imap.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        imap.select("INBOX")

        # 읽지 않은 이메일 검색
        _, message_ids = imap.search(None, "UNSEEN")
        ids = message_ids[0].split()

        if not ids:
            print("✅ 읽지 않은 이메일이 없습니다.")
            return

        # 최근 MAX_EMAILS개만 처리 (오래된 것부터)
        ids = ids[-MAX_EMAILS:]
        print(f"📩 읽지 않은 이메일 {len(ids)}개 처리 시작\n")
        print("=" * 60)

        for i, msg_id in enumerate(ids, 1):
            _, msg_data = imap.fetch(msg_id, "(RFC822)")
            raw_email = msg_data[0][1]
            msg = email.message_from_bytes(raw_email)

            sender_raw = decode_str(msg.get("From", ""))
            subject = decode_str(msg.get("Subject", "(제목 없음)"))
            body = get_email_body(msg)
            sender_email = extract_email_address(sender_raw)

            print(f"\n[{i}/{len(ids)}] 이메일 분석 중...")
            print(f"  📧 보낸 사람 : {sender_raw}")
            print(f"  📌 제목      : {subject}")
            print(f"  📄 본문 미리보기 :\n    {body[:200].replace(chr(10), chr(10)+'    ')}")

            # Claude로 답장 생성
            print("\n  🤖 Claude가 답장 초안 작성 중...")
            try:
                draft = generate_reply(sender_raw, subject, body)
            except Exception as e:
                print(f"  ❌ 초안 생성 실패: {e}")
                continue

            # 초안 출력 및 확인
            print(f"\n{'─' * 60}")
            print("  📝 생성된 답장 초안:")
            print(f"{'─' * 60}")
            print(draft)
            print(f"{'─' * 60}")

            while True:
                choice = input(
                    f"\n  → 이 답장을 [{sender_email}]에게 보내시겠습니까?\n"
                    "     [y] 전송  [e] 직접 수정  [s] 건너뜀  [q] 종료 : "
                ).strip().lower()

                if choice == "y":
                    try:
                        send_reply(sender_email, subject, draft)
                        print(f"  ✅ 답장 전송 완료 → {sender_email}")
                    except Exception as e:
                        print(f"  ❌ 전송 실패: {e}")
                    break

                elif choice == "e":
                    print("  ✏️  답장 내용을 입력하세요 (입력 완료 후 빈 줄에서 Ctrl+D 또는 'END' 입력):")
                    lines = []
                    try:
                        while True:
                            line = input()
                            if line == "END":
                                break
                            lines.append(line)
                    except EOFError:
                        pass
                    draft = "\n".join(lines)
                    print("\n  수정된 초안:")
                    print("─" * 60)
                    print(draft)
                    print("─" * 60)
                    # 다시 y/s/q 선택
                    continue

                elif choice == "s":
                    print("  ⏭  건너뜁니다.")
                    break

                elif choice == "q":
                    print("\n👋 종료합니다.")
                    sys.exit(0)

                else:
                    print("  y / e / s / q 중 하나를 입력하세요.")

            print(f"\n{'=' * 60}")

    print("\n✅ 모든 이메일 처리 완료!")


# ── 실행 ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # 환경 변수 검증
    missing = [v for v in ["GMAIL_ADDRESS", "GMAIL_APP_PASSWORD", "ANTHROPIC_API_KEY"] if not os.environ.get(v)]
    if missing:
        print("❌ 환경 변수가 설정되지 않았습니다:")
        for v in missing:
            print(f"   - {v}")
        print("\n설정 방법 (터미널에서):")
        print("  export GMAIL_ADDRESS='your@gmail.com'")
        print("  export GMAIL_APP_PASSWORD='xxxx xxxx xxxx xxxx'")
        print("  export ANTHROPIC_API_KEY='sk-ant-...'")
        print("\n💡 Gmail 앱 비밀번호: https://myaccount.google.com/apppasswords")
        print("   (2단계 인증 필요 → Google 계정 → 보안 → 앱 비밀번호)")
        sys.exit(1)

    process_emails()
