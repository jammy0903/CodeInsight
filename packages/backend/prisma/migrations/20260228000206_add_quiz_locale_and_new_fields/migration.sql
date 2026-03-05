-- AlterTable
ALTER TABLE "standalone_quizzes" ADD COLUMN     "accepted_answers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "code" TEXT,
ADD COLUMN     "locale" VARCHAR(10) NOT NULL DEFAULT 'ko',
ADD COLUMN     "question_type" VARCHAR(20);

-- CreateIndex
CREATE INDEX "standalone_quizzes_language_quiz_type_locale_idx" ON "standalone_quizzes"("language", "quiz_type", "locale");
