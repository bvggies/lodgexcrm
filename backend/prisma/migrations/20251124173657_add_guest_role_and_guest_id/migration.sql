/*
  Warnings:

  - A unique constraint covering the columns `[guestId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "StaffRole" ADD VALUE 'guest';

-- AlterTable
ALTER TABLE "units" ADD COLUMN     "accessCodes" JSONB,
ADD COLUMN     "keys" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "guestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_guestId_key" ON "users"("guestId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
