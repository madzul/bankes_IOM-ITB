import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// PUT /api/interviews/[id] - Update an interview
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
  
      const interviewId = Number(params.id);
      if (isNaN(interviewId)) {
        return NextResponse.json(
          { success: false, error: "Invalid interview ID" },
          { status: 400 }
        );
      }
  
      const body = await request.json();
      const {
        title,
        description,
        start_time,
        end_time,
        max_students,
        participantIds = [],
      } = body;
  
      // Validation
      if (!start_time || !end_time) {
        return NextResponse.json(
          { success: false, error: "Missing required fields" },
          { status: 400 }
        );
      }
  
      // Check if interview exists and user is the owner
      const existingInterview = await prisma.interview.findUnique({
        where: { interview_id: interviewId },
        include: { slots: true },
      });
  
      if (!existingInterview) {
        return NextResponse.json(
          { success: false, error: "Interview not found" },
          { status: 404 }
        );
      }
  
      if (existingInterview.user_id !== Number(session.user.id)) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
  
      // If max_students changes, we need to update or recreate slots
      let slots = [];
      if (max_students !== existingInterview.max_students) {
        // Delete existing slots (this will also remove student bookings)
        await prisma.interviewSlot.deleteMany({
          where: { interview_id: interviewId },
        });
  
        // Calculate the duration for each slot
        const startDateTime = new Date(start_time);
        const endDateTime = new Date(end_time);
        const totalMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
        const slotDurationMinutes = totalMinutes / max_students;
  
        // Create new slots
        for (let i = 0; i < max_students; i++) {
          const slotStart = new Date(startDateTime.getTime() + i * slotDurationMinutes * 60 * 1000);
          const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60 * 1000);
  
          const slot = await prisma.interviewSlot.create({
            data: {
              interview_id: interviewId,
              slot_number: i + 1,
              start_time: slotStart,
              end_time: slotEnd,
            },
          });
          slots.push(slot);
        }
      } else if (start_time !== existingInterview.start_time.toISOString() || 
                end_time !== existingInterview.end_time.toISOString()) {
        // If only the times changed, update the existing slots proportionally
        const startDateTime = new Date(start_time);
        const endDateTime = new Date(end_time);
        const totalMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60);
        const slotDurationMinutes = totalMinutes / existingInterview.max_students;
  
        // Update each slot with new times
        for (let i = 0; i < existingInterview.slots.length; i++) {
          const slotStart = new Date(startDateTime.getTime() + i * slotDurationMinutes * 60 * 1000);
          const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60 * 1000);
  
          const updatedSlot = await prisma.interviewSlot.update({
            where: { id: existingInterview.slots[i].id },
            data: {
              start_time: slotStart,
              end_time: slotEnd,
            },
          });
          slots.push(updatedSlot);
        }
      }
  
      // Update interview
      const updatedInterview = await prisma.interview.update({
        where: { interview_id: interviewId },
        data: {
          title,
          description,
          start_time: new Date(start_time),
          end_time: new Date(end_time),
          max_students,
        },
      });
  
      // Update participants
      // First, remove all existing participants
      await prisma.interviewParticipant.deleteMany({
        where: { interview_id: interviewId },
      });
  
      // Then add the new ones
      const participants = [];
      for (const participantId of participantIds) {
        const participant = await prisma.interviewParticipant.create({
          data: {
            interview_id: interviewId,
            user_id: participantId,
          },
        });
        participants.push(participant);
      }
  
      return NextResponse.json({
        success: true,
        data: {
          interview: updatedInterview,
          slots,
          participants,
        },
      });
    } catch (error) {
      console.error("Error updating interview:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update interview" },
        { status: 500 }
      );
    }
  }
  
  // DELETE /api/interviews/[id] - Delete an interview
  export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
  
      const interviewId = Number(params.id);
      if (isNaN(interviewId)) {
        return NextResponse.json(
          { success: false, error: "Invalid interview ID" },
          { status: 400 }
        );
      }
  
      // Check if interview exists and user is the owner
      const existingInterview = await prisma.interview.findUnique({
        where: { interview_id: interviewId },
      });
  
      if (!existingInterview) {
        return NextResponse.json(
          { success: false, error: "Interview not found" },
          { status: 404 }
        );
      }
  
      if (
        existingInterview.user_id !== Number(session.user.id)
      ) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
  
      // Delete the interview (will cascade to slots and participants)
      await prisma.interview.delete({
        where: { interview_id: interviewId },
      });
  
      return NextResponse.json({
        success: true,
        message: "Interview deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting interview:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete interview" },
        { status: 500 }
      );
    }
  }
  