#!/usr/bin/env python3
import csv
import re
import ssl
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = Path("/home/jammy/projects/cosine/CodeInsight")
IN_CSV = BASE / "docs/marketing/korea-education-offices-manual-webform-queue-2026-03-05.csv"
OUT_CSV = BASE / "docs/marketing/korea-education-offices-form-send-log-2026-03-05.csv"

UA = {"User-Agent": "Mozilla/5.0"}
CTX = ssl.create_default_context()


def fetch(url: str, timeout: int = 20):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        return r.getcode(), r.read().decode("utf-8", "ignore"), r.geturl()


def submit(url: str, data: dict, timeout: int = 20):
    body = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={**UA, "Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        return r.getcode(), r.read().decode("utf-8", "ignore"), r.geturl()


def parse_forms(html: str):
    forms = []
    for fm in re.findall(r"(<form[\s\S]*?</form>)", html, flags=re.I):
        action = re.search(r'action=["\']([^"\']*)["\']', fm, flags=re.I)
        method = re.search(r'method=["\']([^"\']*)["\']', fm, flags=re.I)
        names = []
        names += re.findall(r'<input[^>]*name=["\']([^"\']+)["\']', fm, flags=re.I)
        names += re.findall(r'<textarea[^>]*name=["\']([^"\']+)["\']', fm, flags=re.I)
        names += re.findall(r'<select[^>]*name=["\']([^"\']+)["\']', fm, flags=re.I)
        forms.append(
            {
                "action": action.group(1).strip() if action else "",
                "method": method.group(1).strip().lower() if method else "get",
                "names": list(dict.fromkeys(names)),
            }
        )
    return forms


def build_payload(names, subject: str, body: str):
    data = {}
    for n in names:
        ln = n.lower()
        if any(k in ln for k in ["name", "writer", "username", "customer"]):
            data[n] = "Sojeong Kim"
        elif any(k in ln for k in ["email", "mail"]):
            data[n] = "l89192164@gmail.com"
        elif any(k in ln for k in ["phone", "tel", "mobile"]):
            data[n] = "010-0000-0000"
        elif any(k in ln for k in ["company", "organization", "org"]):
            data[n] = "CodeInsight"
        elif any(k in ln for k in ["title", "subject"]):
            data[n] = subject
        elif any(k in ln for k in ["message", "content", "body", "question", "inquiry", "detail", "desc"]):
            data[n] = body
        elif any(k in ln for k in ["agree", "consent", "privacy", "policy", "terms"]) or "check" in ln:
            data[n] = "on"
        elif any(k in ln for k in ["captcha", "recaptcha", "token"]):
            data[n] = ""
        else:
            data[n] = "문의"
    return data


def main():
    rows = list(csv.DictReader(IN_CSV.open(encoding="utf-8")))
    log_exists = OUT_CSV.exists()

    with OUT_CSV.open("a", newline="", encoding="utf-8") as f:
        fields = [
            "timestamp_utc",
            "organization",
            "source_url",
            "submit_url",
            "status",
            "detail",
        ]
        w = csv.DictWriter(f, fieldnames=fields)
        if not log_exists:
            w.writeheader()

        for i, row in enumerate(rows, 1):
            org = row.get("organization", "").strip()
            url = row.get("source_url", "").strip()
            subject = row.get("subject_ko", "").strip()
            body = row.get("body_ko", "").strip()
            ts = datetime.now(timezone.utc).isoformat()

            try:
                code, html, final = fetch(url, 20)
            except Exception as e:
                w.writerow(
                    {
                        "timestamp_utc": ts,
                        "organization": org,
                        "source_url": url,
                        "submit_url": "",
                        "status": "fetch_failed",
                        "detail": str(e)[:300],
                    }
                )
                print(f"[{i}/{len(rows)}] FETCH_FAIL {org}")
                continue

            low = html.lower()
            if any(k in low for k in ["captcha", "recaptcha", "hcaptcha", "로그인", "login"]):
                w.writerow(
                    {
                        "timestamp_utc": ts,
                        "organization": org,
                        "source_url": final,
                        "submit_url": "",
                        "status": "blocked_manual",
                        "detail": "captcha_or_login",
                    }
                )
                print(f"[{i}/{len(rows)}] BLOCKED {org}")
                continue

            forms = parse_forms(html)
            if not forms:
                w.writerow(
                    {
                        "timestamp_utc": ts,
                        "organization": org,
                        "source_url": final,
                        "submit_url": "",
                        "status": "no_form_detected",
                        "detail": f"http_{code}",
                    }
                )
                print(f"[{i}/{len(rows)}] NOFORM {org}")
                continue

            form = forms[0]
            for cand in forms:
                if any(
                    any(k in n.lower() for k in ["message", "content", "inquiry", "question", "detail"])
                    for n in cand["names"]
                ):
                    form = cand
                    break

            action = form["action"] or final
            action_url = urllib.parse.urljoin(final, action)
            payload = build_payload(form["names"], subject, body)

            try:
                if form["method"] == "post":
                    s_code, res, res_url = submit(action_url, payload, 20)
                else:
                    q = urllib.parse.urlencode(payload)
                    full_url = action_url + ("&" if "?" in action_url else "?") + q
                    s_code, res, res_url = fetch(full_url, 20)

                low2 = res.lower()
                if s_code < 400 and (res_url != final or any(k in low2 for k in ["접수", "완료", "thank", "submitted"])):
                    status = "submitted"
                else:
                    status = "unclear_manual"
                w.writerow(
                    {
                        "timestamp_utc": ts,
                        "organization": org,
                        "source_url": final,
                        "submit_url": action_url,
                        "status": status,
                        "detail": f"http_{s_code} -> {res_url}"[:300],
                    }
                )
                print(f"[{i}/{len(rows)}] {status.upper()} {org}")
            except Exception as e:
                w.writerow(
                    {
                        "timestamp_utc": ts,
                        "organization": org,
                        "source_url": final,
                        "submit_url": action_url,
                        "status": "submit_failed",
                        "detail": str(e)[:300],
                    }
                )
                print(f"[{i}/{len(rows)}] SUBMIT_FAIL {org}")

            time.sleep(0.7)

    print("done", len(rows))


if __name__ == "__main__":
    main()
