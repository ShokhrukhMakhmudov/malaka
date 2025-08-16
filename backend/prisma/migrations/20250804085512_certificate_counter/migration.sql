-- CreateTable
CREATE TABLE "certificate_counters" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "lastCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_counters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificate_counters_prefix_key" ON "certificate_counters"("prefix");
