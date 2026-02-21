import os
import json
import re

def has_korean(text):
    if not isinstance(text, str):
        return True # Skip non-string fields or treat as OK
    return bool(re.search('[가-힣]', text))

def check_obj(obj):
    if isinstance(obj, str):
        # Ignore common English codes or metadata
        if len(obj) < 5 or obj.startswith('java-') or obj.startswith('py-') or obj.startswith('c-') or obj.startswith('js-'):
            return True
        return has_korean(obj)
    if isinstance(obj, list):
        return all(check_obj(item) for item in obj)
    if isinstance(obj, dict):
        # Special case: don't check 'code' or 'id' fields
        return all(check_obj(v) for k, v in obj.items() if k not in ['code', 'lessonId', 'address', 'pyId', 'visualizationType', 'id'])
    return True

def scan_files(directory):
    files_to_fix = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.json'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        # We specifically want to find files that have LARGE blocks of English
                        # If a file has NO Korean in its title or its first 3 explanations, it's likely English.
                        title = data.get('title', '')
                        if title and not has_korean(title):
                            files_to_fix.append(path)
                            continue
                        
                        # Check first step explanation
                        steps = data.get('content', {}).get('steps', [])
                        if steps and not has_korean(steps[0].get('explanation', '가')): # default to have korean if not found
                             files_to_fix.append(path)
                except Exception as e:
                    pass
    return files_to_fix

if __name__ == "__main__":
    content_dir = 'packages/backend/prisma/content'
    results = scan_files(content_dir)
    for res in results:
        print(res)
