-- AlterTable
ALTER TABLE "JoniScenario" ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
ADD COLUMN     "estimatedMinutes" INTEGER NOT NULL DEFAULT 15,
ALTER COLUMN "groupId" DROP NOT NULL,
ALTER COLUMN "orderInGroup" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "JoniScenarioGroup" ADD COLUMN     "groupType" TEXT NOT NULL DEFAULT 'module',
ADD COLUMN     "orderInSubject" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "JoniScenarioSubject" ADD COLUMN     "icon" TEXT,
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "JoniScenarioGroup_subjectId_orderInSubject_idx" ON "JoniScenarioGroup"("subjectId", "orderInSubject");
