import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * paths:
 *   /api/interviews/slots/{id}:
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Numeric ID of the interview slot
 *         required: true
 *         schema:
 *           type: integer
 *
 *     delete:
 *       tags:
 *         - InterviewSlots
 *       summary: Delete a single interview slot
 *       security:
 *         - CookieAuth: []
 *       responses:
 *         '200':
 *           description: Slot deleted successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     const: true
 *                   message:
 *                     type: string
 *         '400':
 *           description: Invalid slot ID
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '401':
 *           description: Not authenticated or wrong role
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '403':
 *           description: Unauthorized—only the interview owner can delete slots
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '404':
 *           description: Slot not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '500':
 *           description: Server error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *     patch:
 *       tags:
 *         - InterviewSlots
 *       summary: Update a single interview slot’s start and end time
 *       security:
 *         - CookieAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 start_time:
 *                   type: string
 *                   format: date-time
 *                 end_time:
 *                   type: string
 *                   format: date-time
 *               required:
 *                 - start_time
 *                 - end_time
 *       responses:
 *         '200':
 *           description: Updated slot returned
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     const: true
 *                   data:
 *                     $ref: '#/components/schemas/InterviewSlot'
 *         '400':
 *           description: Missing or invalid fields
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '401':
 *           description: Not authenticated or wrong role
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '403':
 *           description: Unauthorized—only the interview owner can update slots
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '404':
 *           description: Slot not found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '500':
 *           description: Server error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 */

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
// PATCH /api/interviews/slots/[id] - Update a single slot
export async function PATCH(
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
    const { start_time, end_time } = body;

    if (!start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if slot exists and user is the interview owner
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

    if (slot.Interview.user_id !== Number(session.user.id)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update the slot
    const updatedSlot = await prisma.interviewSlot.update({
      where: { id: slotId },
      data: {
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