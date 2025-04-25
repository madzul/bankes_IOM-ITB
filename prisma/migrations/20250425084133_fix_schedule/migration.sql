-- AddForeignKey
ALTER TABLE "InterviewParticipant" ADD CONSTRAINT "InterviewParticipant_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "InterviewSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
