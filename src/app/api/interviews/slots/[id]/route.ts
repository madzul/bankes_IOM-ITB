import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

// DELETE /api/interviews/slots/[id] - Delete a single slot
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

    const slotId = Number(params.id);
    if (isNaN(slotId)) {
      return NextResponse.json(
        { success: false, error: "Invalid slot ID" },
        { status: 400 }
      );
    }

    // Check if slot exists
    const slot = await prisma.interviewSlot.findUnique({
      where: { id: slotId },
      include: {
        Interview: {
          select: {
            user_id: true,
            interview_id: true,
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

    // Check if user is the owner of the interview
    if (slot.Interview.user_id !== Number(session.user.id)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Only the interview owner can delete slots" },
        { status: 403 }
      );
    }

    // Get all slots for this interview to reindex them
    const allSlots = await prisma.interviewSlot.findMany({
      where: { interview_id: slot.Interview.interview_id },
      orderBy: { slot_number: 'asc' },
    });

    // Delete the slot
    await prisma.interviewSlot.delete({
      where: { id: slotId },
    });

    // Reindex remaining slots to keep slot_numbers consistent
    for (let i = 0; i < allSlots.length; i++) {
      if (allSlots[i].id !== slotId) {
        const newSlotNumber = i + 1;
        await prisma.interviewSlot.update({
          where: { id: allSlots[i].id },
          data: { 
            slot_number: newSlotNumber < allSlots[i].slot_number ? newSlotNumber : allSlots[i].slot_number 
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Slot deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting slot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete slot" },
      { status: 500 }
    );
  }
}