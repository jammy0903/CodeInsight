#!/bin/bash

echo "📊 CodeInsight Course Statistics"
echo "================================"
echo ""

for lang in c java javascript python python-practical; do
  lesson_count=$(find prisma/content/$lang/lessons -name "*.json" 2>/dev/null | wc -l)
  chapter_count=$(jq '.chapters | length' prisma/content/$lang/curriculum.json 2>/dev/null)
  
  case $lang in
    "c") name="C" ;;
    "java") name="Java" ;;
    "javascript") name="JavaScript" ;;
    "python") name="Python" ;;
    "python-practical") name="Python (업무 자동화)" ;;
  esac
  
  echo "📖 $name"
  echo "   Chapters: $chapter_count"
  echo "   Lessons:  $lesson_count"
  echo ""
done

total_lessons=$(find prisma/content -name "*.json" -path "*/lessons/*" | wc -l)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Total Lessons: $total_lessons"
