import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { interviewId, slotId } = await request.json();
    
    if (!interviewId || !slotId) {
      return NextResponse.json(
        { success: false, error: "Missing interview ID or slot ID" },
        { status: 400 }
      );
    }

    // Check if the interview and slot exist
    const slot = await prisma.interviewSlot.findUnique({
      where: { 
        id: slotId,
        interview_id: interviewId
      },
    });

    if (!slot) {
      return NextResponse.json(
        { success: false, error: "Slot not found" },
        { status: 404 }
      );
    }

    // Check if the user is already a participant for this slot
    const existingParticipant = await prisma.interviewParticipant.findFirst({
      where: {
        interview_id: interviewId,
        user_id: Number(session.user.id),
        slot_id: slotId
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { success: false, error: "You are already participating in this slot" },
        { status: 400 }
      );
    }

    // Add the user as a participant for this specific slot
    const participant = await prisma.interviewParticipant.create({
      data: {
        interview_id: interviewId,
        user_id: Number(session.user.id),
        slot_id: slotId
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: participant,
      message: "Successfully joined the interview slot"
    });
  } catch (error) {
    console.error("Error joining interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to join interview slot" },
      { status: 500 }
    );
  }
}

// API route to leave an interview
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { interviewId } = await request.json();
    
    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: "Missing interview ID" },
        { status: 400 }
      );
    }

    // Delete the participation record
    await prisma.interviewParticipant.delete({
      where: {
        interview_id_user_id: {
          interview_id: interviewId,
          user_id: Number(session.user.id),
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Successfully left the interview session"
    });
  } catch (error) {
    console.error("Error leaving interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to leave interview" },
      { status: 500 }
    );
  }
}