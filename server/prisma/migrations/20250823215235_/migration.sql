/*
  Warnings:

  - You are about to drop the column `phase` on the `JoniScript` table. All the data in the column will be lost.
  - You are about to drop the column `currentTransmissionOrder` on the `JoniScriptPractice` table. All the data in the column will be lost.
  - You are about to drop the column `transmissionScores` on the `JoniScriptPractice` table. All the data in the column will be lost.
  - Added the required column `nodeScores` to the `JoniScriptPractice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pathTaken` to the `JoniScriptPractice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visitedNodes` to the `JoniScriptPractice` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "JoniScript_phase_idx";

-- AlterTable
ALTER TABLE "JoniScript" DROP COLUMN "phase",
ADD COLUMN     "dagStructure" JSONB,
ADD COLUMN     "startNodeId" TEXT,
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "JoniScriptPractice" DROP COLUMN "currentTransmissionOrder",
DROP COLUMN "transmissionScores",
ADD COLUMN     "currentNodeId" TEXT,
ADD COLUMN     "decisionQuality" JSONB,
ADD COLUMN     "nodeScores" JSONB NOT NULL,
ADD COLUMN     "pathTaken" JSONB NOT NULL,
ADD COLUMN     "sessionMetrics" JSONB,
ADD COLUMN     "visitedNodes" JSONB NOT NULL;

-- CreateIndex
CREATE INDEX "JoniScript_tags_idx" ON "JoniScript"("tags");
