import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

// POST /api/slots/[id]/book - Book a slot
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Awaiting the params
  ) {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user?.id || session.user.role !== "Mahasiswa") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
  
      const { id } = await params; // Await params before using id
      const slotId = Number(id);
      if (isNaN(slotId)) {
        return NextResponse.json(
          { success: false, error: "Invalid slot ID" },
          { status: 400 }
        );
      }
  
      // Check if slot exists and is available
      const slot = await prisma.interviewSlot.findUnique({
        where: { id: slotId },
      });
  
      if (!slot) {
        return NextResponse.json(
          { success: false, error: "Slot not found" },
          { status: 404 }
        );
      }
  
      if (slot.student_id) {
        return NextResponse.json(
          { success: false, error: "Slot already booked" },
          { status: 400 }
        );
      }
  
      // Check if student has already booked another slot in the same period
      const existingBooking = await prisma.interviewSlot.findFirst({
        where: {
          period_id: slot.period_id,
          student_id: Number(session.user.id),
        },
      });
  
      if (existingBooking) {
        return NextResponse.json(
          { 
            success: false, 
            error: "You already have a booking for this period",
            existingSlotId: existingBooking.id
          },
          { status: 400 }
        );
      }
  
      // Book the slot
      const updatedSlot = await prisma.interviewSlot.update({
        where: { id: slotId },
        data: {
          student_id: Number(session.user.id),
          booked_at: new Date(),
        },
      });

      // Create notes for the interview
      await prisma.notes.create({
        data: {
          slot_id: slotId,
          student_id: Number(session.user.id),
          text: JSON.stringify({
            namaPewawancara:"", 
            noHpPewawancara:"",
            namaMahasiswa:"",
            nimMahasiswa:"",
          })
        }
      });
  
      return NextResponse.json({
        success: true,
        data: updatedSlot,
      });
    } catch (error) {
      console.error("Error booking slot:", error);
      return NextResponse.json(
        { success: false, error: "Failed to book slot" },
        { status: 500 }
      );
    }
  }
