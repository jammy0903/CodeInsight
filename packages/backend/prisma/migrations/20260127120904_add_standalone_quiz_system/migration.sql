-- CreateTable
CREATE TABLE "standalone_quizzes" (
    "id" TEXT NOT NULL,
    "language" VARCHAR(20) NOT NULL,
    "quiz_type" VARCHAR(30) NOT NULL,
    "chapter_id" VARCHAR(50) NOT NULL,
    "chapter_title" VARCHAR(100) NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB,
    "answer" VARCHAR(500) NOT NULL,
    "explanation" TEXT NOT NULL,
    "concepts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulty" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "order_num" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "standalone_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standalone_quiz_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "user_answer" VARCHAR(500) NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "time_spent" INTEGER,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "standalone_quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "standalone_quizzes_language_quiz_type_idx" ON "standalone_quizzes"("language", "quiz_type");

-- CreateIndex
CREATE INDEX "standalone_quizzes_language_chapter_id_idx" ON "standalone_quizzes"("language", "chapter_id");

-- CreateIndex
CREATE INDEX "standalone_quizzes_language_quiz_type_chapter_id_idx" ON "standalone_quizzes"("language", "quiz_type", "chapter_id");

-- CreateIndex
CREATE INDEX "standalone_quiz_attempts_user_id_created_at_idx" ON "standalone_quiz_attempts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "standalone_quiz_attempts_user_id_is_correct_idx" ON "standalone_quiz_attempts"("user_id", "is_correct");

-- CreateIndex
CREATE INDEX "standalone_quiz_attempts_quiz_id_idx" ON "standalone_quiz_attempts"("quiz_id");

-- CreateIndex
CREATE INDEX "standalone_quiz_attempts_user_id_quiz_id_idx" ON "standalone_quiz_attempts"("user_id", "quiz_id");

-- AddForeignKey
ALTER TABLE "standalone_quiz_attempts" ADD CONSTRAINT "standalone_quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standalone_quiz_attempts" ADD CONSTRAINT "standalone_quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "standalone_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
