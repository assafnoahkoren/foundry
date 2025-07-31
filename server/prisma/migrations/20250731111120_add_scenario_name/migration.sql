/*
  Warnings:

  - Added the required column `name` to the `JoniScenario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable - First add the column as nullable
ALTER TABLE "JoniScenario" ADD COLUMN "name" TEXT;

-- Update existing rows with a default name based on their order and subject
UPDATE "JoniScenario" s
SET "name" = CONCAT('Scenario ', s."orderInGroup" + 1, ' - ', sub."name")
FROM "JoniScenarioSubject" sub
WHERE s."subjectId" = sub."id";

-- Now make the column NOT NULL
ALTER TABLE "JoniScenario" ALTER COLUMN "name" SET NOT NULL;
