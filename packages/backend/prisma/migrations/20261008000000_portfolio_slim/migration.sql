-- DropForeignKey
ALTER TABLE "oauth_accounts" DROP CONSTRAINT IF EXISTS "oauth_accounts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT IF EXISTS "submissions_problem_id_fkey";

-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT IF EXISTS "submissions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "drafts" DROP CONSTRAINT IF EXISTS "drafts_problem_id_fkey";

-- DropForeignKey
ALTER TABLE "drafts" DROP CONSTRAINT IF EXISTS "drafts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_progress" DROP CONSTRAINT IF EXISTS "user_progress_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "user_progress" DROP CONSTRAINT IF EXISTS "user_progress_user_id_fkey";

-- DropForeignKey
ALTER TABLE "lesson_activities" DROP CONSTRAINT IF EXISTS "lesson_activities_user_id_fkey";

-- DropForeignKey
ALTER TABLE "lesson_activities" DROP CONSTRAINT IF EXISTS "lesson_activities_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_histories" DROP CONSTRAINT IF EXISTS "chat_histories_user_id_fkey";

-- DropForeignKey
ALTER TABLE "chat_histories" DROP CONSTRAINT IF EXISTS "chat_histories_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_attempts" DROP CONSTRAINT IF EXISTS "quiz_attempts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_attempts" DROP CONSTRAINT IF EXISTS "quiz_attempts_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "user_notes" DROP CONSTRAINT IF EXISTS "user_notes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_notes" DROP CONSTRAINT IF EXISTS "user_notes_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "user_notes" DROP CONSTRAINT IF EXISTS "user_notes_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "session_contexts" DROP CONSTRAINT IF EXISTS "session_contexts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "session_contexts" DROP CONSTRAINT IF EXISTS "session_contexts_lesson_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "step_activities" DROP CONSTRAINT IF EXISTS "step_activities_user_id_fkey";

-- DropForeignKey
ALTER TABLE "step_activities" DROP CONSTRAINT IF EXISTS "step_activities_lesson_activity_id_fkey";

-- DropForeignKey
ALTER TABLE "step_activities" DROP CONSTRAINT IF EXISTS "step_activities_lesson_id_fkey";

-- DropForeignKey
ALTER TABLE "user_streaks" DROP CONSTRAINT IF EXISTS "user_streaks_user_id_fkey";

-- DropForeignKey
ALTER TABLE "standalone_quiz_attempts" DROP CONSTRAINT IF EXISTS "standalone_quiz_attempts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "standalone_quiz_attempts" DROP CONSTRAINT IF EXISTS "standalone_quiz_attempts_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "reports_user_id_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT IF EXISTS "reports_lesson_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "users";

-- DropTable
DROP TABLE IF EXISTS "oauth_accounts";

-- DropTable
DROP TABLE IF EXISTS "problems";

-- DropTable
DROP TABLE IF EXISTS "submissions";

-- DropTable
DROP TABLE IF EXISTS "drafts";

-- DropTable
DROP TABLE IF EXISTS "user_progress";

-- DropTable
DROP TABLE IF EXISTS "lesson_activities";

-- DropTable
DROP TABLE IF EXISTS "chat_histories";

-- DropTable
DROP TABLE IF EXISTS "quiz_attempts";

-- DropTable
DROP TABLE IF EXISTS "user_notes";

-- DropTable
DROP TABLE IF EXISTS "user_profiles";

-- DropTable
DROP TABLE IF EXISTS "session_contexts";

-- DropTable
DROP TABLE IF EXISTS "step_activities";

-- DropTable
DROP TABLE IF EXISTS "user_streaks";

-- DropTable
DROP TABLE IF EXISTS "standalone_quizzes";

-- DropTable
DROP TABLE IF EXISTS "standalone_quiz_attempts";

-- DropTable
DROP TABLE IF EXISTS "reports";


-- RemoveCourses: 포트폴리오에서 제외한 강의(C++, Python 업무 자동화, AI Code Literacy) 데이터 삭제
-- lesson_contents, quizzes는 lessons에 ON DELETE CASCADE
DELETE FROM "lessons" WHERE "chapter_id" IN (
  SELECT "id" FROM "chapters" WHERE "language_id" IN ('cpp', 'python-practical', 'ai-literacy')
);
DELETE FROM "chapters" WHERE "language_id" IN ('cpp', 'python-practical', 'ai-literacy');
DELETE FROM "languages" WHERE "id" IN ('cpp', 'python-practical', 'ai-literacy');
