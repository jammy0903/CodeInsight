import os
import json
import re

def has_korean(text):
    return bool(re.search('[가-힣]', text))

def scan_files(directory):
    files_to_fix = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.json'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        title = data.get('title', '')
                        if title and not has_korean(title):
                            files_to_fix.append(path)
                except Exception as e:
                    pass
    return files_to_fix

if __name__ == "__main__":
    content_dir = 'packages/backend/prisma/content'
    results = scan_files(content_dir)
    for res in results:
        print(res)
