import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

// GET /api/slots/[id] - Get a slot by ID
export async function GET(
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

    const slot = await prisma.interviewSlot.findUnique({
      where: { id: slotId },
      include: {
        Participants: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        Student: {
          select: {
            User: {
              select: {
                name: true,
              },
            },
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

    return NextResponse.json({
      success: true,
      data: slot,
    });
  } catch (error) {
    console.error("Error fetching slot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch slot" },
      { status: 500 }
    );
  }
}

// PUT /api/slots/[id] - Update slot
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

    const slotId = Number(params.id);
    if (isNaN(slotId)) {
      return NextResponse.json(
        { success: false, error: "Invalid slot ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      start_time,
      end_time,
    } = body;

    // Validation
    if (!start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if slot exists and user is the owner
    const existingSlot = await prisma.interviewSlot.findUnique({
      where: { id: slotId },
    });

    if (!existingSlot) {
      return NextResponse.json(
        { success: false, error: "Slot not found" },
        { status: 404 }
      );
    }

    if (existingSlot.user_id !== Number(session.user.id)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update the slot
    const updatedSlot = await prisma.interviewSlot.update({
      where: { id: slotId },
      data: {
        title,
        description,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSlot,
    });
  } catch (error) {
    console.error("Error updating slot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update slot" },
      { status: 500 }
    );
  }
}

// DELETE /api/slots/[id] - Delete a slot
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

    // Check if slot exists and user is the owner
    const existingSlot = await prisma.interviewSlot.findUnique({
      where: { id: slotId },
    });

    if (!existingSlot) {
      return NextResponse.json(
        { success: false, error: "Slot not found" },
        { status: 404 }
      );
    }

    if (existingSlot.user_id !== Number(session.user.id)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete the slot (will cascade to participants)
    await prisma.interviewSlot.delete({
      where: { id: slotId },
    });

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