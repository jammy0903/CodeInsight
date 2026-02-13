# Database Schema Reference

**Source of Truth**: `packages/backend/prisma/schema.prisma`

## Key Tables
| Domain | Tables |
|--------|--------|
| Auth | users, oauth_accounts |
| Content | languages, chapters, lessons, lesson_contents, quizzes |
| Learning | user_progress, lesson_activities, step_activities |
| Misc | user_profiles, user_streaks, problems, submissions, reports |

## Migration
```bash
# Dev: Create + apply
cd packages/backend && npx prisma migrate dev --name name

# Prod: Apply only
npx prisma migrate deploy
```

**Checklist**: NULL policy → FK onDelete → Indexes → Reverse fields
