#!/usr/bin/env python3
import csv
import os
import smtplib
import ssl
import time
from datetime import datetime, timezone
from email.message import EmailMessage

CSV_PATH='korea-coding-education-all-contacts-with-drafts-2026-03-05.csv'
LOG_PATH='docs/marketing/korea-outreach-send-log-2026-03-05.csv'


def load_env(path='.env'):
    if not os.path.exists(path):
        return
    with open(path,'r',encoding='utf-8') as f:
        for line in f:
            line=line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k,v=line.split('=',1)
            if k and k not in os.environ:
                os.environ[k]=v.strip().strip('"').strip("'")


def build_long_ko(org):
    return f"""안녕하세요, {org} 담당자님.

AI가 코드를 빠르게 생성하는 지금, 교육 현장에서는 오히려
"코드를 읽고 해석하는 역량"의 중요성이 더 커지고 있습니다.

CodeInsight는 학습자가 코드 실행 과정을 직접 보면서 이해하도록 돕는
코드 실행 시각화 학습 플랫폼입니다.

주요 기능:
- 코드 실행 단계별 시각화
- 변수/메모리 상태 변화 추적
- 함수 호출 흐름 추적
- 레슨 모드 + 플레이그라운드 모드
- C / Python / JavaScript / Java 지원

도입 혜택:
- 맞춤 커리큘럼 제공 (기관 과정/난이도/언어에 맞춤 구성)

먼저 아래에서 직접 확인해보세요.
https://codeinsight.online

도입 검토 원하시면 회신 부탁드립니다.

CodeInsight
l89192164@gmail.com
"""


def main():
    load_env('.env')
    from_email=os.environ.get('GMAIL_EMAIL','').strip()
    app_pw=os.environ.get('GMAIL_APP_PASSWORD','').strip()
    if not from_email or not app_pw:
        raise SystemExit('GMAIL_EMAIL / GMAIL_APP_PASSWORD missing')

    rows=list(csv.DictReader(open(CSV_PATH,encoding='utf-8')))
    rec=[]
    seen=set()
    for r in rows:
        if (r.get('contact_type') or '').lower()!='email':
            continue
        email_addr=(r.get('contact_value') or '').strip().lower()
        if not email_addr or email_addr in seen:
            continue
        seen.add(email_addr)
        rec.append({'org':r.get('organization','').strip(),'email':email_addr})

    log_exists=os.path.exists(LOG_PATH)
    sent_set=set()
    if log_exists:
        for r in csv.DictReader(open(LOG_PATH,encoding='utf-8')):
            if r.get('status') in ('sent','sent_long_ko'):
                sent_set.add((r.get('org','').strip(), r.get('email','').strip().lower()))

    with open(LOG_PATH,'a',newline='',encoding='utf-8') as lf:
        w=csv.DictWriter(lf,fieldnames=['timestamp_utc','org','email','subject','status','error'])
        if not log_exists:
            w.writeheader()

        for i,r in enumerate(rec,1):
            org=r['org']; to=r['email']
            key=(org,to)
            subject='[CodeInsight] AI 시대, 코드 해석력 중심 교육 도입 제안'
            body=build_long_ko(org)

            if key in sent_set:
                w.writerow({'timestamp_utc':datetime.now(timezone.utc).isoformat(),'org':org,'email':to,'subject':subject,'status':'skipped_already_sent','error':''})
                print(f'[{i}/{len(rec)}] SKIP {org} <{to}>')
                continue

            msg=EmailMessage()
            msg['From']=f'Sojeong Kim <{from_email}>'
            msg['To']=to
            msg['Subject']=subject
            msg.set_content(body)

            try:
                with smtplib.SMTP_SSL('smtp.gmail.com',465,context=ssl.create_default_context(),timeout=30) as s:
                    s.login(from_email,app_pw)
                    s.send_message(msg)
                w.writerow({'timestamp_utc':datetime.now(timezone.utc).isoformat(),'org':org,'email':to,'subject':subject,'status':'sent_long_ko','error':''})
                print(f'[{i}/{len(rec)}] SENT {org} <{to}>')
            except Exception as e:
                w.writerow({'timestamp_utc':datetime.now(timezone.utc).isoformat(),'org':org,'email':to,'subject':subject,'status':'failed','error':str(e)[:500]})
                print(f'[{i}/{len(rec)}] FAIL {org} <{to}> :: {e}')

            time.sleep(1.1)

if __name__=='__main__':
    main()
