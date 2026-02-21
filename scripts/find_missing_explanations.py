
import glob
import json
import os

def find_missing_explanations(lesson_dir):
    missing_explanations = {}
    json_files = glob.glob(os.path.join(lesson_dir, "*.json"))

    for file_path in json_files:
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                lesson_id = data.get("lessonId", os.path.basename(file_path).replace(".json", ""))
                
                # Check for "content.steps"
                if "content" in data and "steps" in data["content"]:
                    for i, step in enumerate(data["content"]["steps"]):
                        # Check if "explanation" key is missing or its value is empty
                        if "explanation" not in step or not step["explanation"]:
                            if lesson_id not in missing_explanations:
                                missing_explanations[lesson_id] = []
                            missing_explanations[lesson_id].append(
                                {
                                    "step_index": i,
                                    "step_title": step.get("title", f"Step {i+1}"),
                                    "file_path": file_path
                                }
                            )
            except json.JSONDecodeError:
                print(f"Error decoding JSON from {file_path}")
            except Exception as e:
                print(f"An unexpected error occurred with {file_path}: {e}")
    return missing_explanations

lesson_directory = "packages/backend/prisma/content/javascript/lessons/"
missing = find_missing_explanations(lesson_directory)

if missing:
    print("다음 레슨의 단계에 설명이 누락되었거나 비어 있습니다:")
    for lesson_id, steps in missing.items():
        print(f"  레슨 ID: {lesson_id}")
        for step_info in steps:
            print(f"    - 단계 [{step_info["step_index"] + 1}]: {step_info["step_title"]} (파일: {step_info["file_path"]})")
else:
    print("모든 JavaScript 레슨 파일의 모든 단계에 설명이 잘 채워져 있습니다.")

