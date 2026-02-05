-- DropForeignKey
ALTER TABLE "ai_usage_records" DROP CONSTRAINT IF EXISTS "ai_usage_records_user_id_fkey";

-- DropForeignKey
ALTER TABLE "monthly_usage_summaries" DROP CONSTRAINT IF EXISTS "monthly_usage_summaries_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_subscriptions" DROP CONSTRAINT IF EXISTS "user_subscriptions_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "user_subscriptions" DROP CONSTRAINT IF EXISTS "user_subscriptions_user_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "ai_usage_records";

-- DropTable
DROP TABLE IF EXISTS "monthly_usage_summaries";

-- DropTable
DROP TABLE IF EXISTS "user_subscriptions";

-- DropTable
DROP TABLE IF EXISTS "subscription_plans";
