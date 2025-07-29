-- CreateEnum
CREATE TYPE "GrantCause" AS ENUM ('manual', 'subscription');

-- CreateTable
CREATE TABLE "UserAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "subFeatureId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    "grantCause" "GrantCause" NOT NULL DEFAULT 'manual',
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserAccess_userId_idx" ON "UserAccess"("userId");

-- CreateIndex
CREATE INDEX "UserAccess_featureId_idx" ON "UserAccess"("featureId");

-- CreateIndex
CREATE INDEX "UserAccess_subFeatureId_idx" ON "UserAccess"("subFeatureId");

-- CreateIndex
CREATE INDEX "UserAccess_grantedBy_idx" ON "UserAccess"("grantedBy");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccess_userId_featureId_subFeatureId_key" ON "UserAccess"("userId", "featureId", "subFeatureId");

-- AddForeignKey
ALTER TABLE "UserAccess" ADD CONSTRAINT "UserAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAccess" ADD CONSTRAINT "UserAccess_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
