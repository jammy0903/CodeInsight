#!/usr/bin/env python3
import csv, re, urllib.request, urllib.parse, ssl, time
from datetime import datetime, timezone

IN='docs/marketing/korea-enterprise-batch1-5-merged-100-2026-03-05.csv'
OUT='docs/marketing/korea-enterprise-form-send-log-2026-03-05.csv'
UA={'User-Agent':'Mozilla/5.0'}
CTX=ssl.create_default_context()

MSG_SHORT=(
"안녕하세요. CodeInsight 도입 제안드립니다. "
"AI 시대 코드 해석력 강화를 위해 코드 실행 시각화 학습 플랫폼을 제공하고 있습니다. "
"https://codeinsight.online 확인 부탁드립니다."
)

def fetch(url, timeout=20):
    req=urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        return r.getcode(), r.read().decode('utf-8','ignore'), r.geturl()

def submit(url, data, timeout=20):
    body=urllib.parse.urlencode(data).encode('utf-8')
    req=urllib.request.Request(url, data=body, headers={**UA, 'Content-Type':'application/x-www-form-urlencoded'})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        return r.getcode(), r.read().decode('utf-8','ignore'), r.geturl()

def parse_forms(html):
    forms=[]
    for fm in re.findall(r'(<form[\s\S]*?</form>)', html, flags=re.I):
        action=re.search(r'action=["\']([^"\']*)["\']', fm, flags=re.I)
        method=re.search(r'method=["\']([^"\']*)["\']', fm, flags=re.I)
        names=[]
        names += re.findall(r'<input[^>]*name=["\']([^"\']+)["\']', fm, flags=re.I)
        names += re.findall(r'<textarea[^>]*name=["\']([^"\']+)["\']', fm, flags=re.I)
        names += re.findall(r'<select[^>]*name=["\']([^"\']+)["\']', fm, flags=re.I)
        forms.append({
            'action': action.group(1).strip() if action else '',
            'method': (method.group(1).strip().lower() if method else 'get'),
            'names': list(dict.fromkeys(names)),
        })
    return forms

def build_payload(names, org):
    d={}
    for n in names:
        ln=n.lower()
        if any(k in ln for k in ['name','writer','username','customer']):
            d[n]='Sojeong Kim'
        elif any(k in ln for k in ['email','mail']):
            d[n]='l89192164@gmail.com'
        elif any(k in ln for k in ['phone','tel','mobile']):
            d[n]='010-0000-0000'
        elif any(k in ln for k in ['company','organization','org']):
            d[n]='CodeInsight'
        elif any(k in ln for k in ['title','subject']):
            d[n]=f'[CodeInsight] {org} 도입 제안'
        elif any(k in ln for k in ['message','content','body','question','inquiry','detail','desc']):
            d[n]=MSG_SHORT
        elif any(k in ln for k in ['agree','consent','privacy','policy','terms']) or 'check' in ln:
            d[n]='on'
        elif any(k in ln for k in ['captcha','recaptcha','token']):
            d[n]=''
        else:
            d[n]='CodeInsight 문의'
    return d

rows=list(csv.DictReader(open(IN,encoding='utf-8')))
targets=[r for r in rows if r.get('verification_status')=='verified' and r.get('contact_type')=='form']

log_exists=False
try:
    open(OUT,encoding='utf-8').close(); log_exists=True
except Exception:
    pass

with open(OUT,'a',newline='',encoding='utf-8') as f:
    fields=['timestamp_utc','organization','contact_url','status','detail']
    w=csv.DictWriter(f,fieldnames=fields)
    if not log_exists:
        w.writeheader()

    for i,t in enumerate(targets,1):
        org=t['organization']
        url=t['contact_url']
        ts=datetime.now(timezone.utc).isoformat()
        try:
            sc,html,final=fetch(url,20)
        except Exception as e:
            w.writerow({'timestamp_utc':ts,'organization':org,'contact_url':url,'status':'fetch_failed','detail':str(e)[:300]})
            print(f'[{i}/{len(targets)}] FETCH_FAIL {org}')
            continue

        low=html.lower()
        if any(k in low for k in ['captcha','recaptcha','hcaptcha','로그인','login']):
            w.writerow({'timestamp_utc':ts,'organization':org,'contact_url':final,'status':'blocked_manual','detail':'captcha_or_login'})
            print(f'[{i}/{len(targets)}] BLOCKED {org}')
            continue

        forms=parse_forms(html)
        if not forms:
            w.writerow({'timestamp_utc':ts,'organization':org,'contact_url':final,'status':'no_form_detected','detail':'manual_required'})
            print(f'[{i}/{len(targets)}] NOFORM {org}')
            continue

        form=forms[0]
        for f1 in forms:
            if any(any(k in n.lower() for k in ['message','content','inquiry','question','detail']) for n in f1['names']):
                form=f1; break

        action=form['action'] or final
        action_url=urllib.parse.urljoin(final, action)
        payload=build_payload(form['names'], org)

        try:
            if form['method']=='post':
                sc2,res,res_url=submit(action_url,payload,20)
            else:
                q=urllib.parse.urlencode(payload)
                sc2,res,res_url=fetch(action_url + ('&' if '?' in action_url else '?') + q,20)
            l2=res.lower()
            if sc2<400 and (res_url!=final or any(k in l2 for k in ['접수','완료','thank','submitted'])):
                st='submitted'
            else:
                st='unclear_manual'
            w.writerow({'timestamp_utc':ts,'organization':org,'contact_url':action_url,'status':st,'detail':f'http_{sc2} -> {res_url}'[:300]})
            print(f'[{i}/{len(targets)}] {st.upper()} {org}')
        except Exception as e:
            w.writerow({'timestamp_utc':ts,'organization':org,'contact_url':action_url,'status':'submit_failed','detail':str(e)[:300]})
            print(f'[{i}/{len(targets)}] SUBMIT_FAIL {org}')

        time.sleep(0.7)

print('done',len(targets))
