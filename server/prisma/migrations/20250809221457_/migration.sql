-- CreateTable
CREATE TABLE "JoniCommBlock" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "icaoReference" TEXT,
    "rules" JSONB NOT NULL,
    "examples" JSONB NOT NULL,
    "commonErrors" JSONB,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 1,
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoniCommBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoniTransmissionTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "transmissionType" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 2,
    "estimatedSeconds" INTEGER NOT NULL DEFAULT 10,
    "blocks" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoniTransmissionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoniScript" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scriptType" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "difficultyLevel" INTEGER NOT NULL DEFAULT 3,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 5,
    "flightContext" JSONB NOT NULL,
    "learningObjectives" JSONB,
    "prerequisites" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoniScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoniScriptTransmission" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "transmissionId" TEXT NOT NULL,
    "orderInScript" INTEGER NOT NULL,
    "actorRole" TEXT NOT NULL,
    "expectedDelay" INTEGER,
    "triggerCondition" TEXT,

    CONSTRAINT "JoniScriptTransmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoniCommBlockProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "proficiencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "practiceCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "lastPracticed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoniCommBlockProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoniTransmissionPractice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transmissionId" TEXT NOT NULL,
    "userTranscript" TEXT NOT NULL,
    "blockScores" JSONB NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "feedback" JSONB,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JoniTransmissionPractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoniScriptPractice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "currentTransmissionOrder" INTEGER NOT NULL DEFAULT 1,
    "transmissionScores" JSONB NOT NULL,
    "overallScore" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "sessionRecording" TEXT,

    CONSTRAINT "JoniScriptPractice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JoniCommBlock_code_key" ON "JoniCommBlock"("code");

-- CreateIndex
CREATE INDEX "JoniCommBlock_category_idx" ON "JoniCommBlock"("category");

-- CreateIndex
CREATE INDEX "JoniCommBlock_code_idx" ON "JoniCommBlock"("code");

-- CreateIndex
CREATE UNIQUE INDEX "JoniTransmissionTemplate_code_key" ON "JoniTransmissionTemplate"("code");

-- CreateIndex
CREATE INDEX "JoniTransmissionTemplate_transmissionType_idx" ON "JoniTransmissionTemplate"("transmissionType");

-- CreateIndex
CREATE INDEX "JoniTransmissionTemplate_context_idx" ON "JoniTransmissionTemplate"("context");

-- CreateIndex
CREATE UNIQUE INDEX "JoniScript_code_key" ON "JoniScript"("code");

-- CreateIndex
CREATE INDEX "JoniScript_scriptType_idx" ON "JoniScript"("scriptType");

-- CreateIndex
CREATE INDEX "JoniScript_phase_idx" ON "JoniScript"("phase");

-- CreateIndex
CREATE INDEX "JoniScriptTransmission_scriptId_idx" ON "JoniScriptTransmission"("scriptId");

-- CreateIndex
CREATE INDEX "JoniScriptTransmission_transmissionId_idx" ON "JoniScriptTransmission"("transmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "JoniScriptTransmission_scriptId_orderInScript_key" ON "JoniScriptTransmission"("scriptId", "orderInScript");

-- CreateIndex
CREATE INDEX "JoniCommBlockProgress_userId_idx" ON "JoniCommBlockProgress"("userId");

-- CreateIndex
CREATE INDEX "JoniCommBlockProgress_blockId_idx" ON "JoniCommBlockProgress"("blockId");

-- CreateIndex
CREATE UNIQUE INDEX "JoniCommBlockProgress_userId_blockId_key" ON "JoniCommBlockProgress"("userId", "blockId");

-- CreateIndex
CREATE INDEX "JoniTransmissionPractice_userId_idx" ON "JoniTransmissionPractice"("userId");

-- CreateIndex
CREATE INDEX "JoniTransmissionPractice_transmissionId_idx" ON "JoniTransmissionPractice"("transmissionId");

-- CreateIndex
CREATE INDEX "JoniTransmissionPractice_completedAt_idx" ON "JoniTransmissionPractice"("completedAt");

-- CreateIndex
CREATE INDEX "JoniScriptPractice_userId_scriptId_idx" ON "JoniScriptPractice"("userId", "scriptId");

-- CreateIndex
CREATE INDEX "JoniScriptPractice_status_idx" ON "JoniScriptPractice"("status");

-- AddForeignKey
ALTER TABLE "JoniScriptTransmission" ADD CONSTRAINT "JoniScriptTransmission_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "JoniScript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniScriptTransmission" ADD CONSTRAINT "JoniScriptTransmission_transmissionId_fkey" FOREIGN KEY ("transmissionId") REFERENCES "JoniTransmissionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniCommBlockProgress" ADD CONSTRAINT "JoniCommBlockProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniCommBlockProgress" ADD CONSTRAINT "JoniCommBlockProgress_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "JoniCommBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniTransmissionPractice" ADD CONSTRAINT "JoniTransmissionPractice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniTransmissionPractice" ADD CONSTRAINT "JoniTransmissionPractice_transmissionId_fkey" FOREIGN KEY ("transmissionId") REFERENCES "JoniTransmissionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniScriptPractice" ADD CONSTRAINT "JoniScriptPractice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoniScriptPractice" ADD CONSTRAINT "JoniScriptPractice_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "JoniScript"("id") ON DELETE CASCADE ON UPDATE CASCADE;
