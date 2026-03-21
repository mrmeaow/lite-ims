-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboarding_data" JSONB DEFAULT '{}';
