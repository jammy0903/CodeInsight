-- AlterTable
ALTER TABLE "oauth_accounts" ADD COLUMN     "email" TEXT;

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "age_group" VARCHAR(20),
    "occupation" VARCHAR(30),
    "programming_exp" VARCHAR(20),
    "learning_goal" VARCHAR(30),
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_contexts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lesson_activity_id" UUID,
    "screen_width" INTEGER,
    "screen_height" INTEGER,
    "orientation" VARCHAR(20),
    "input_method" VARCHAR(10),
    "user_agent" VARCHAR(500),
    "language" VARCHAR(10),
    "connection_type" VARCHAR(20),
    "effective_type" VARCHAR(10),
    "local_hour" INTEGER,
    "local_weekday" INTEGER,
    "timezone" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step_activities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lesson_activity_id" UUID NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "step_index" INTEGER NOT NULL,
    "duration" INTEGER,
    "went_back" BOOLEAN NOT NULL DEFAULT false,
    "vis_hover_count" INTEGER,
    "vis_click_count" INTEGER,
    "ai_question_count" INTEGER,
    "code_selections" INTEGER,
    "scroll_events" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "step_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "session_contexts_user_id_created_at_idx" ON "session_contexts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "session_contexts_local_hour_idx" ON "session_contexts"("local_hour");

-- CreateIndex
CREATE INDEX "session_contexts_local_weekday_idx" ON "session_contexts"("local_weekday");

-- CreateIndex
CREATE INDEX "step_activities_user_id_lesson_id_idx" ON "step_activities"("user_id", "lesson_id");

-- CreateIndex
CREATE INDEX "step_activities_lesson_id_step_index_idx" ON "step_activities"("lesson_id", "step_index");

-- CreateIndex
CREATE UNIQUE INDEX "step_activities_lesson_activity_id_step_index_key" ON "step_activities"("lesson_activity_id", "step_index");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_contexts" ADD CONSTRAINT "session_contexts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_contexts" ADD CONSTRAINT "session_contexts_lesson_activity_id_fkey" FOREIGN KEY ("lesson_activity_id") REFERENCES "lesson_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_activities" ADD CONSTRAINT "step_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_activities" ADD CONSTRAINT "step_activities_lesson_activity_id_fkey" FOREIGN KEY ("lesson_activity_id") REFERENCES "lesson_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_activities" ADD CONSTRAINT "step_activities_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
