-- CreateTable
CREATE TABLE "call_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guestId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "callSid" TEXT,
    "duration" INTEGER,
    "recordingSid" TEXT,
    "recordingUrl" TEXT,
    "recordingDuration" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "call_history_userId_idx" ON "call_history"("userId");

-- CreateIndex
CREATE INDEX "call_history_guestId_idx" ON "call_history"("guestId");

-- CreateIndex
CREATE INDEX "call_history_phoneNumber_idx" ON "call_history"("phoneNumber");

-- CreateIndex
CREATE INDEX "call_history_startedAt_idx" ON "call_history"("startedAt");

-- CreateIndex
CREATE INDEX "call_history_status_idx" ON "call_history"("status");

-- AddForeignKey
ALTER TABLE "call_history" ADD CONSTRAINT "call_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_history" ADD CONSTRAINT "call_history_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
