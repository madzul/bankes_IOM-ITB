-- DropForeignKey
ALTER TABLE "Interview" DROP CONSTRAINT "Interview_student_id_fkey";

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "description" TEXT,
ADD COLUMN     "max_students" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "title" TEXT,
ALTER COLUMN "student_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "InterviewParticipant" (
    "id" SERIAL NOT NULL,
    "interview_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSlot" (
    "id" SERIAL NOT NULL,
    "interview_id" INTEGER NOT NULL,
    "student_id" INTEGER,
    "slot_number" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "booked_at" TIMESTAMP(3),

    CONSTRAINT "InterviewSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewParticipant_interview_id_user_id_key" ON "InterviewParticipant"("interview_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSlot_interview_id_slot_number_key" ON "InterviewSlot"("interview_id", "slot_number");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewParticipant" ADD CONSTRAINT "InterviewParticipant_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "Interview"("interview_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewParticipant" ADD CONSTRAINT "InterviewParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSlot" ADD CONSTRAINT "InterviewSlot_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "Interview"("interview_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSlot" ADD CONSTRAINT "InterviewSlot_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE SET NULL ON UPDATE CASCADE;
