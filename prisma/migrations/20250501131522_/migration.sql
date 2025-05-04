/*
  Warnings:

  - You are about to drop the column `interview_id` on the `InterviewParticipant` table. All the data in the column will be lost.
  - You are about to drop the column `interview_id` on the `InterviewSlot` table. All the data in the column will be lost.
  - You are about to drop the column `slot_number` on the `InterviewSlot` table. All the data in the column will be lost.
  - The primary key for the `Notes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `interview_id` on the `Notes` table. All the data in the column will be lost.
  - You are about to drop the `Interview` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slot_id,user_id]` on the table `InterviewParticipant` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slot_id` on table `InterviewParticipant` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `period_id` to the `InterviewSlot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `InterviewSlot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slot_id` to the `Notes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Interview" DROP CONSTRAINT "Interview_period_id_fkey";

-- DropForeignKey
ALTER TABLE "Interview" DROP CONSTRAINT "Interview_student_id_fkey";

-- DropForeignKey
ALTER TABLE "Interview" DROP CONSTRAINT "Interview_user_id_fkey";

-- DropForeignKey
ALTER TABLE "InterviewParticipant" DROP CONSTRAINT "InterviewParticipant_interview_id_fkey";

-- DropForeignKey
ALTER TABLE "InterviewParticipant" DROP CONSTRAINT "InterviewParticipant_slot_id_fkey";

-- DropForeignKey
ALTER TABLE "InterviewSlot" DROP CONSTRAINT "InterviewSlot_interview_id_fkey";

-- DropForeignKey
ALTER TABLE "Notes" DROP CONSTRAINT "Notes_interview_id_fkey";

-- DropIndex
DROP INDEX "InterviewParticipant_interview_id_user_id_key";

-- DropIndex
DROP INDEX "InterviewSlot_interview_id_slot_number_key";

-- AlterTable
ALTER TABLE "InterviewParticipant" DROP COLUMN "interview_id",
ALTER COLUMN "slot_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "InterviewSlot" DROP COLUMN "interview_id",
DROP COLUMN "slot_number",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "period_id" INTEGER NOT NULL,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Notes" DROP CONSTRAINT "Notes_pkey",
DROP COLUMN "interview_id",
ADD COLUMN     "slot_id" INTEGER NOT NULL,
ADD CONSTRAINT "Notes_pkey" PRIMARY KEY ("slot_id", "student_id");

-- DropTable
DROP TABLE "Interview";

-- CreateIndex
CREATE UNIQUE INDEX "InterviewParticipant_slot_id_user_id_key" ON "InterviewParticipant"("slot_id", "user_id");

-- AddForeignKey
ALTER TABLE "Notes" ADD CONSTRAINT "Notes_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "InterviewSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewParticipant" ADD CONSTRAINT "InterviewParticipant_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "InterviewSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSlot" ADD CONSTRAINT "InterviewSlot_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSlot" ADD CONSTRAINT "InterviewSlot_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "Period"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;
