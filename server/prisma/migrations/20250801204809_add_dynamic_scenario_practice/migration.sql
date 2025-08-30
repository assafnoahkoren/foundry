-- AlterTable
ALTER TABLE "JoniScenario" ADD COLUMN     "flightInformationJson" JSONB,
ADD COLUMN     "initialContext" TEXT,
ADD COLUMN     "scenarioType" TEXT NOT NULL DEFAULT 'standard',
ALTER COLUMN "expectedAnswer" DROP NOT NULL,
ALTER COLUMN "currentStatus" DROP NOT NULL;

-- CreateTable
CREATE TABLE "JoniScenarioStep" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorRole" TEXT,
    "eventDescription" TEXT NOT NULL,
    "eventMessage" TEXT NOT NULL,
    "expectedComponents" JSONB NOT NULL,
    "correctResponseExample" TEXT NOT NULL,
    "nextStepCondition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoniScenarioStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoniScenarioPractice" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "currentStepOrder" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "totalScore" DOUBLE PRECISION,

    CONSTRAINT "JoniScenarioPractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoniScenarioStepResponse" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "userResponse" TEXT NOT NULL,
    "responseAnalysis" JSONB NOT NULL,
    "correctness" DOUBLE PRECISION NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JoniScenarioStepResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JoniScenarioStep_scenarioId_stepOrder_idx" ON "JoniScenarioStep"("scenarioId", "stepOrder");

-- CreateIndex
CREATE UNIQUE INDEX "JoniScenarioStep_scenarioId_stepOrder_key" ON "JoniScenarioStep"("scenarioId", "stepOrder");

-- CreateIndex
CREATE INDEX "JoniScenarioPractice_userId_scenarioId_idx" ON "JoniScenarioPractice"("userId", "scenarioId");

-- CreateIndex
CREATE INDEX "JoniScenarioPractice_status_idx" ON "JoniScenarioPractice"("status");

-- CreateIndex
CREATE INDEX "JoniScenarioStepResponse_practiceId_stepId_idx" ON "JoniScenarioStepResponse"("practiceId", "stepId");

-- CreateIndex
CREATE UNIQUE INDEX "JoniScenarioStepResponse_practiceId_stepId_key" ON "JoniScenarioStepResponse"("practiceId", "stepId");

-- CreateIndex
CREATE INDEX "JoniScenario_scenarioType_idx" ON "JoniScenario"("scenarioType");

-- AddForeignKey
ALTER TABLE "JoniScenarioStep" ADD CONSTRAINT "JoniScenarioStep_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "JoniScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniScenarioPractice" ADD CONSTRAINT "JoniScenarioPractice_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "JoniScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniScenarioPractice" ADD CONSTRAINT "JoniScenarioPractice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniScenarioStepResponse" ADD CONSTRAINT "JoniScenarioStepResponse_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "JoniScenarioPractice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniScenarioStepResponse" ADD CONSTRAINT "JoniScenarioStepResponse_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "JoniScenarioStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
