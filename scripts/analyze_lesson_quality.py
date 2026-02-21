import os
import json
import re

CONTENT_DIR = '/home/jammy/projects/cosine/CodeInsight/packages/backend/prisma/content'
LANGUAGES = ['c', 'java', 'python', 'javascript', 'python-practical']

ANALOGY_KEYWORDS = [
    # Korean
    '비유', '마치', '검문소', '처럼', '같아', '같습', '상상', '생각해', '예를', '소개팅', 
    '택배', '호텔', '방', '그릇', '상자', '주머니', '지도', '신분증', '여권', '도서관',
    '책', '메모장', '리모컨', '자판기', '은행', '통장', '지갑', '가방', '열쇠', '문패',
    # English (just in case)
    'like', 'imagine', 'think of', 'analogy', 'similar'
]

def check_analogy(text):
    if not text: return False
    for kw in ANALOGY_KEYWORDS:
        if kw in text:
            return True
    return False

def find_missing_boilerplate(code, steps):
    lines = code.split('\n')
    step_lines = set()
    for s in steps:
        if 'line' in s and isinstance(s['line'], int):
            step_lines.add(s['line'])
        elif 'highlight' in s and isinstance(s['highlight'], list):
             for h in s['highlight']:
                 step_lines.add(h)

    missing = []
    
    for i, line in enumerate(lines):
        line_num = i + 1
        line_content = line.strip()
        
        # Check imports/includes
        if line_content.startswith('#include') or \
           line_content.startswith('import ') or \
           line_content.startswith('package ') or \
           line_content.startswith('from '):
            if line_num not in step_lines:
                missing.append(f"Import/Header skipped (Line {line_num}: {line_content})")
                
        # Check main function declaration
        if 'main(' in line_content and '{' in line_content: # roughly catch main
             if line_num not in step_lines:
                missing.append(f"Main declaration skipped (Line {line_num}: {line_content})")
        
        # Check class declaration (Java)
        if line_content.startswith('public class ') or line_content.startswith('class '):
             if line_num not in step_lines:
                 # Classes are sometimes skipped in simple lessons, but worth noting
                 pass 

    return missing

def analyze_file(filepath, language):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        content = data.get('content', {})
        code = content.get('code', "")
        steps = content.get('steps', [])
        
        if not steps and 'steps' in data: steps = data['steps']
        if not steps: return None

        issues = []

        # 1. Start Check: Does it start from the beginning?
        # We check if the first step covers line 1 or 2 or 3.
        # If the code has > 3 lines but the first step starts at line 5, it's suspicious.
        first_step_line = steps[0].get('line')
        if first_step_line and first_step_line > 3 and len(code.split('\n')) > 3:
            # Check if previous lines were empty
            code_lines = code.split('\n')
            is_prev_empty = True
            for k in range(first_step_line - 1):
                if code_lines[k].strip():
                    is_prev_empty = False
                    break
            if not is_prev_empty:
                issues.append(f"Starts late (First step at Line {first_step_line})")

        # 2. Boilerplate Check (Imports, Main)
        missing_boilerplate = find_missing_boilerplate(code, steps)
        issues.extend(missing_boilerplate)

        # 3. Analogy Check
        has_analogy = False
        all_explanation_text = ""
        for s in steps:
            exp = s.get('explanation', "")
            if isinstance(exp, dict):
                exp = exp.get('markdown', "") or exp.get('ko', "") or str(exp)
            elif isinstance(exp, str):
                pass
            else:
                exp = ""
            
            all_explanation_text += " " + exp
            
        if check_analogy(all_explanation_text) or check_analogy(data.get('misconceptions', [{'why':''}])[0].get('why', '')) or check_analogy(data.get('concept', '')):
            has_analogy = True
            
        if not has_analogy:
            issues.append("No explicit analogy keywords found")

        if issues:
            return issues
        return None

    except Exception as e:
        return [f"Error checking file: {str(e)}"]

print("Analyzing lessons for Quality (Analogy, Flow, Imports)...")
results = {}

for lang in LANGUAGES:
    dir_path = os.path.join(CONTENT_DIR, lang, 'lessons')
    if not os.path.exists(dir_path): continue
    
    results[lang] = {}
    
    for filename in sorted(os.listdir(dir_path)):
        if not filename.endswith('.json'): continue
        
        filepath = os.path.join(dir_path, filename)
        issues = analyze_file(filepath, lang)
        
        if issues:
            results[lang][filename] = issues

# Report
total_issues = 0
for lang, files in results.items():
    if not files: continue
    print(f"\n[{lang.upper()}] Issues Found:")
    for filename, issues in files.items():
        # Clean up output
        filtered_issues = [i for i in issues if "No explicit analogy" not in i] # Separate analogy
        analogy_issue = "No Analogy" if any("No explicit analogy" in i for i in issues) else ""
        
        # If only analogy missing, maybe less critical, but user asked for it.
        
        display_issues = []
        if analogy_issue: display_issues.append("❌ 비유 부족")
        
        for i in issues:
            if "Start late" in i: display_issues.append("⚠️ 시작 스텝 늦음 (앞부분 건너뜀)")
            if "Import" in i: display_issues.append("⚠️ Import/Header 설명 누락")
            if "Main" in i: display_issues.append("⚠️ Main 함수 선언 설명 누락")
            
        if display_issues:
            print(f"  - {filename}: {', '.join(display_issues)}")
            total_issues += 1

if total_issues == 0:
    print("\nAmazing! No obvious quality issues found based on heuristics!")
else:
    print(f"\nFound potential improvements in {total_issues} files.")
