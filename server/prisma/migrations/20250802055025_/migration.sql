/*
  Warnings:

  - You are about to drop the column `orderInGroup` on the `JoniScenario` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "JoniScenario_groupId_orderInGroup_idx";

-- AlterTable
ALTER TABLE "JoniScenario" DROP COLUMN "orderInGroup";

-- CreateIndex
CREATE INDEX "JoniScenario_difficulty_idx" ON "JoniScenario"("difficulty");
