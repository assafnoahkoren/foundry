/*
  Warnings:

  - Made the column `groupId` on table `JoniScenario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orderInGroup` on table `JoniScenario` required. This step will fail if there are existing NULL values in that column.

*/

-- First, create a default group for each subject that has orphaned scenarios
INSERT INTO "JoniScenarioGroup" ("id", "name", "description", "subjectId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Default Group',
  'Automatically created group for existing scenarios',
  s."subjectId",
  NOW(),
  NOW()
FROM "JoniScenario" s
WHERE s."groupId" IS NULL
GROUP BY s."subjectId";

-- Update orphaned scenarios to use the default group
UPDATE "JoniScenario" s
SET 
  "groupId" = g."id",
  "orderInGroup" = (
    SELECT COUNT(*) 
    FROM "JoniScenario" s2 
    WHERE s2."subjectId" = s."subjectId" 
      AND s2."id" < s."id"
      AND s2."groupId" IS NULL
  )
FROM "JoniScenarioGroup" g
WHERE s."groupId" IS NULL
  AND g."subjectId" = s."subjectId"
  AND g."name" = 'Default Group';

-- DropForeignKey
ALTER TABLE "JoniScenario" DROP CONSTRAINT "JoniScenario_groupId_fkey";

-- AlterTable
ALTER TABLE "JoniScenario" ALTER COLUMN "groupId" SET NOT NULL,
ALTER COLUMN "orderInGroup" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "JoniScenario" ADD CONSTRAINT "JoniScenario_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "JoniScenarioGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
