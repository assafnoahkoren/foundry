-- AlterTable
ALTER TABLE "JoniScenario" ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "orderInGroup" INTEGER;

-- CreateTable
CREATE TABLE "JoniScenarioGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoniScenarioGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JoniScenarioGroup_subjectId_idx" ON "JoniScenarioGroup"("subjectId");

-- CreateIndex
CREATE INDEX "JoniScenario_groupId_idx" ON "JoniScenario"("groupId");

-- CreateIndex
CREATE INDEX "JoniScenario_groupId_orderInGroup_idx" ON "JoniScenario"("groupId", "orderInGroup");

-- AddForeignKey
ALTER TABLE "JoniScenarioGroup" ADD CONSTRAINT "JoniScenarioGroup_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "JoniScenarioSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniScenario" ADD CONSTRAINT "JoniScenario_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "JoniScenarioGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
