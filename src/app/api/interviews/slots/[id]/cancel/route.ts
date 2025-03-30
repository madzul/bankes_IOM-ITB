import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

// POST /api/interviews/slots/[id]/cancel - Cancel a booking
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
  
      const slotId = Number(params.id);
      if (isNaN(slotId)) {
        return NextResponse.json(
          { success: false, error: "Invalid slot ID" },
          { status: 400 }
        );
      }
  
      // Check if slot exists and is booked by the user
      const slot = await prisma.interviewSlot.findUnique({
        where: { id: slotId },
        include: {
          Interview: {
            select: {
              user_id: true,
            },
          },
        },
      });
  
      if (!slot) {
        return NextResponse.json(
          { success: false, error: "Slot not found" },
          { status: 404 }
        );
      }
  
      // Allow cancellation if:
      // 1. Student cancelling their own booking
      // 2. IOM staff who created the interview
      if (
        session.user.role === "Mahasiswa" && 
        slot.student_id !== Number(session.user.id)
      ) {
        return NextResponse.json(
          { success: false, error: "Unauthorized to cancel this booking" },
          { status: 403 }
        );
      } else if (
        session.user.role === "Pengurus_IOM" && 
        slot.Interview.user_id !== Number(session.user.id)
      ) {
        return NextResponse.json(
          { success: false, error: "Unauthorized to cancel this booking" },
          { status: 403 }
        );
      }
  
      // Cancel the booking
      const updatedSlot = await prisma.interviewSlot.update({
        where: { id: slotId },
        data: {
          student_id: null,
          booked_at: null,
        },
      });
  
      return NextResponse.json({
        success: true,
        data: updatedSlot,
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      return NextResponse.json(
        { success: false, error: "Failed to cancel booking" },
        { status: 500 }
      );
    }
  }
  