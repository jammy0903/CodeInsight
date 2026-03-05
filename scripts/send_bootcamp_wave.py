#!/usr/bin/env python3
import csv
import os
import smtplib
import ssl
import time
import argparse
import hashlib
from datetime import datetime, timezone
from email.message import EmailMessage

CSV_PATH = os.environ.get('BOOTCAMP_WAVE_CSV', 'docs/marketing/bootcamp-outreach-wave1-20-with-drafts-2026-03-05.csv')
LOG_PATH = os.environ.get('BOOTCAMP_SEND_LOG', 'docs/marketing/bootcamp-outreach-send-log-2026-03-05.csv')
FROM_EMAIL = os.environ.get('GMAIL_EMAIL') or os.environ.get('GMAIL_USER', 'l89192164@gmail.com')
SENDER_NAME = os.environ.get('SENDER_NAME', 'Sojeong Kim')
PRODUCT_URL = os.environ.get('PRODUCT_URL', 'https://codeinsight.online')
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '465'))


def load_dotenv(path='.env'):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v


def pick_variant(name: str, n: int) -> int:
    h = hashlib.sha256(name.encode("utf-8")).hexdigest()
    return int(h[:8], 16) % n


def build_subject(name: str) -> str:
    subjects = [
        f"[{name}] In the AI era, code interpretation skills matter more — CodeInsight",
        f"[{name}] A practical way to improve beginner code understanding — CodeInsight",
        f"[{name}] CodeInsight for stronger runtime comprehension in cohorts",
    ]
    return subjects[pick_variant(name, len(subjects))]


def organization_line(name: str) -> str:
    n = name.lower()
    if "academy" in n:
        return "For academy-style cohort learning, this is especially effective in early-stage classes."
    if "school" in n:
        return "For school-format programs, it helps standardize runtime explanation quality across instructors."
    if "bootcamp" in n:
        return "For intensive bootcamp cohorts, it helps reduce early confusion and keep momentum."
    return "For structured coding cohorts, it improves clarity in runtime and memory concepts."


def build_body(name: str, country: str = "") -> str:
    openings = [
        f"Hi {name} team,",
        f"Hello {name} team,",
        f"Hi {name} admissions/curriculum team,",
    ]
    opening = openings[pick_variant(name + "open", len(openings))]
    org_line = organization_line(name)
    country_line = ""
    if country and country != "Unknown":
        country_line = f"\nWe understand your team is operating in {country}, and this can be deployed without changing your existing curriculum structure.\n"

    return f"""{opening}

In the AI era, learners need code interpretation and debugging understanding more than typing speed.

CodeInsight helps students understand runtime behavior visually and build strong fundamentals.
{org_line}{country_line}

Core features:
- Step-by-step code execution visualization
- Real-time variable and memory state tracking
- Structured function call flow tracing
- Lesson mode + Playground mode
- Support for C / Python / JavaScript / Java

Adoption benefit:
- Customized curriculum aligned to your bootcamp track, level, and language stack

Try it directly first:
{PRODUCT_URL}

If you want to adopt it for your cohorts, just reply to this email.

{SENDER_NAME}
CodeInsight
{FROM_EMAIL}
"""


def send_email(to_email: str, subject: str, body: str, app_password: str):
    msg = EmailMessage()
    msg['From'] = f"{SENDER_NAME} <{FROM_EMAIL}>"
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=30) as server:
        server.login(FROM_EMAIL, app_password)
        server.send_message(msg)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=0, help='send only first N recipients')
    parser.add_argument('--name', type=str, default='', help='send only recipient with exact name')
    args = parser.parse_args()

    load_dotenv('.env')
    app_password = os.environ.get('GMAIL_APP_PASSWORD', '')
    if not app_password:
        raise SystemExit('GMAIL_APP_PASSWORD not found in environment/.env')

    with open(CSV_PATH, 'r', encoding='utf-8-sig', newline='') as f:
        rows = [r for r in csv.DictReader(f) if (r.get('email') or '').strip()]

    if args.name:
        rows = [r for r in rows if (r.get('name') or '').strip() == args.name]
    if args.limit and args.limit > 0:
        rows = rows[:args.limit]

    if not rows:
        raise SystemExit('No recipients with email found in CSV')

    # read existing sent emails to avoid duplicates
    sent_set = set()
    if os.path.exists(LOG_PATH):
        with open(LOG_PATH, 'r', encoding='utf-8', newline='') as lf:
            for r in csv.DictReader(lf):
                sent_set.add((r.get('name','').strip(), r.get('email','').strip().lower()))

    log_exists = os.path.exists(LOG_PATH)
    with open(LOG_PATH, 'a', encoding='utf-8', newline='') as lf:
        fieldnames = ['timestamp_utc','name','email','subject','status','error']
        writer = csv.DictWriter(lf, fieldnames=fieldnames)
        if not log_exists:
            writer.writeheader()

        for idx, r in enumerate(rows, 1):
            name = (r.get('name') or '').strip()
            email = (r.get('email') or '').strip().lower()
            key = (name, email)
            country = (r.get("country") or "").strip()
            subject = build_subject(name)
            body = build_body(name, country)

            if key in sent_set:
                writer.writerow({
                    'timestamp_utc': datetime.now(timezone.utc).isoformat(),
                    'name': name,
                    'email': email,
                    'subject': subject,
                    'status': 'skipped_already_sent',
                    'error': ''
                })
                print(f"[{idx}/{len(rows)}] SKIP {name} <{email}> already sent")
                continue

            try:
                send_email(email, subject, body, app_password)
                writer.writerow({
                    'timestamp_utc': datetime.now(timezone.utc).isoformat(),
                    'name': name,
                    'email': email,
                    'subject': subject,
                    'status': 'sent',
                    'error': ''
                })
                print(f"[{idx}/{len(rows)}] SENT {name} <{email}>")
            except Exception as e:
                writer.writerow({
                    'timestamp_utc': datetime.now(timezone.utc).isoformat(),
                    'name': name,
                    'email': email,
                    'subject': subject,
                    'status': 'failed',
                    'error': str(e)[:500]
                })
                print(f"[{idx}/{len(rows)}] FAIL {name} <{email}> :: {e}")

            time.sleep(1.2)


if __name__ == '__main__':
    main()
