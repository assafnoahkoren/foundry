-- CreateTable
CREATE TABLE "JoniScenarioSubject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoniScenarioSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoniScenario" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "flightInformation" JSONB NOT NULL,
    "expectedAnswer" JSONB NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoniScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoniScenarioResponse" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userResponse" TEXT NOT NULL,
    "responseAnalysis" JSONB NOT NULL,
    "correctness" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoniScenarioResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JoniScenarioSubject_name_key" ON "JoniScenarioSubject"("name");

-- CreateIndex
CREATE INDEX "JoniScenario_subjectId_idx" ON "JoniScenario"("subjectId");

-- CreateIndex
CREATE INDEX "JoniScenarioResponse_scenarioId_idx" ON "JoniScenarioResponse"("scenarioId");

-- CreateIndex
CREATE INDEX "JoniScenarioResponse_userId_idx" ON "JoniScenarioResponse"("userId");

-- CreateIndex
CREATE INDEX "JoniScenarioResponse_createdAt_idx" ON "JoniScenarioResponse"("createdAt");

-- AddForeignKey
ALTER TABLE "JoniScenario" ADD CONSTRAINT "JoniScenario_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "JoniScenarioSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniScenarioResponse" ADD CONSTRAINT "JoniScenarioResponse_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "JoniScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniScenarioResponse" ADD CONSTRAINT "JoniScenarioResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
