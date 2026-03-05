#!/usr/bin/env python3
import csv, os, smtplib, ssl, time
from datetime import datetime, timezone
from email.message import EmailMessage

CSV_PATH='docs/marketing/korea-org-guessed-emails-2026-03-05.csv'
LOG_PATH='docs/marketing/korea-outreach-send-log-2026-03-05.csv'


def load_env(path='.env'):
    if not os.path.exists(path): return
    with open(path,encoding='utf-8') as f:
        for line in f:
            line=line.strip()
            if not line or line.startswith('#') or '=' not in line: continue
            k,v=line.split('=',1)
            if k and k not in os.environ:
                os.environ[k]=v.strip().strip('"').strip("'")


def body(org):
    return f"""안녕하세요, {org} 담당자님.

AI가 코드를 빠르게 생성하는 지금, 교육 현장에서는 오히려
코드를 읽고 해석하는 역량의 중요성이 더 커지고 있습니다.

CodeInsight는 코드 실행 과정을 단계별로 시각화해
학습자가 실행 흐름과 메모리 변화를 직관적으로 이해하도록 돕습니다.

주요 기능:
- 코드 실행 단계별 시각화
- 변수/메모리 상태 변화 추적
- 함수 호출 흐름 추적
- 레슨 모드 + 플레이그라운드 모드
- C / Python / JavaScript / Java 지원

도입 혜택:
- 맞춤 커리큘럼 제공 (기관 과정/난이도/언어 기준)

먼저 아래에서 확인 부탁드립니다.
https://codeinsight.online

도입 검토 원하시면 회신 부탁드립니다.

CodeInsight
l89192164@gmail.com
"""


def main():
    load_env('.env')
    from_email=os.environ.get('GMAIL_EMAIL','').strip()
    pw=os.environ.get('GMAIL_APP_PASSWORD','').strip()
    if not from_email or not pw:
        raise SystemExit('gmail creds missing')

    rec=list(csv.DictReader(open(CSV_PATH,encoding='utf-8')))
    sent=set()
    if os.path.exists(LOG_PATH):
        for r in csv.DictReader(open(LOG_PATH,encoding='utf-8')):
            if r.get('status') in ('sent_long_ko','sent','sent_guess_ko'):
                sent.add(r.get('email','').strip().lower())

    log_exists=os.path.exists(LOG_PATH)
    with open(LOG_PATH,'a',newline='',encoding='utf-8') as lf:
        w=csv.DictWriter(lf,fieldnames=['timestamp_utc','org','email','subject','status','error'])
        if not log_exists:
            w.writeheader()

        for i,r in enumerate(rec,1):
            org=r['organization'].strip()
            to=r['contact_value'].strip().lower()
            subj='[CodeInsight] AI 시대, 코드 해석력 중심 교육 도입 제안'
            if to in sent:
                w.writerow({'timestamp_utc':datetime.now(timezone.utc).isoformat(),'org':org,'email':to,'subject':subj,'status':'skipped_already_sent','error':''})
                print(f'[{i}/{len(rec)}] SKIP {org} <{to}>')
                continue

            msg=EmailMessage()
            msg['From']=f'Sojeong Kim <{from_email}>'
            msg['To']=to
            msg['Subject']=subj
            msg.set_content(body(org))

            try:
                with smtplib.SMTP_SSL('smtp.gmail.com',465,context=ssl.create_default_context(),timeout=30) as s:
                    s.login(from_email,pw)
                    s.send_message(msg)
                w.writerow({'timestamp_utc':datetime.now(timezone.utc).isoformat(),'org':org,'email':to,'subject':subj,'status':'sent_guess_ko','error':''})
                print(f'[{i}/{len(rec)}] SENT {org} <{to}>')
            except Exception as e:
                w.writerow({'timestamp_utc':datetime.now(timezone.utc).isoformat(),'org':org,'email':to,'subject':subj,'status':'failed','error':str(e)[:500]})
                print(f'[{i}/{len(rec)}] FAIL {org} <{to}> :: {e}')
            time.sleep(1.0)

if __name__=='__main__':
    main()
