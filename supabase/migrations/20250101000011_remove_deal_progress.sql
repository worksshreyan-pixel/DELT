-- Remove progress column from deals since it is now dynamically derived from milestones
ALTER TABLE "deals" DROP COLUMN IF EXISTS "progress";
