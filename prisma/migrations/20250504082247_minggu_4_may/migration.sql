-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('KTP', 'CV', 'Transkrip_Nilai');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Mahasiswa', 'Guest', 'Pengurus_IOM');

-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Student" (
    "student_id" SERIAL NOT NULL,
    "nim" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "major" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "File" (
    "file_id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "type" "FileType" NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("file_id")
);

-- CreateTable
CREATE TABLE "Status" (
    "student_id" INTEGER NOT NULL,
    "period_id" INTEGER NOT NULL,
    "passDitmawa" BOOLEAN NOT NULL,
    "passIOM" BOOLEAN NOT NULL,
    "passInterview" BOOLEAN NOT NULL,
    "amount" INTEGER,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("student_id","period_id")
);

-- CreateTable
CREATE TABLE "Period" (
    "period_id" SERIAL NOT NULL,
    "period" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_current" BOOLEAN NOT NULL,
    "is_open" BOOLEAN NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("period_id")
);

-- CreateTable
CREATE TABLE "Interview" (
    "interview_id" SERIAL NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "student_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "period_id" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "max_students" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("interview_id")
);

-- CreateTable
CREATE TABLE "Notes" (
    "interview_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Notes_pkey" PRIMARY KEY ("interview_id","student_id")
);

-- CreateTable
CREATE TABLE "InterviewParticipant" (
    "id" SERIAL NOT NULL,
    "interview_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slot_id" INTEGER,

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

-- CreateTable
CREATE TABLE "NotificationEndpoint" (
    "user_id" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationEndpoint_pkey" PRIMARY KEY ("user_id","endpoint")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notification_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "header" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "has_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_user_id_key" ON "User"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_student_id_key" ON "Student"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewParticipant_interview_id_user_id_key" ON "InterviewParticipant"("interview_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSlot_interview_id_slot_number_key" ON "InterviewSlot"("interview_id", "slot_number");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "Period"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "Period"("period_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notes" ADD CONSTRAINT "Notes_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "Interview"("interview_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notes" ADD CONSTRAINT "Notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewParticipant" ADD CONSTRAINT "InterviewParticipant_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "Interview"("interview_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewParticipant" ADD CONSTRAINT "InterviewParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewParticipant" ADD CONSTRAINT "InterviewParticipant_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "InterviewSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSlot" ADD CONSTRAINT "InterviewSlot_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "Interview"("interview_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSlot" ADD CONSTRAINT "InterviewSlot_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("student_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEndpoint" ADD CONSTRAINT "NotificationEndpoint_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
