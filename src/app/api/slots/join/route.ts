import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();
/**
 * @swagger
 * paths:
 *   /api/slots/join:
 *     post:
 *       tags:
 *         - Slots
 *       summary: Join a slot as a participant
 *       security:
 *         - CookieAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slotId:
 *                   type: integer
 *               required:
 *                 - slotId
 *       responses:
 *         '200':
 *           description: Successfully joined the slot
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     const: true
 *                   data:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       slot_id:
 *                         type: integer
 *                       user_id:
 *                         type: integer
 *                   message:
 *                     type: string
 *         '400':
 *           description: Missing slot ID or already participating
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
 *     delete:
 *       tags:
 *         - Slots
 *       summary: Leave a slot (remove participation)
 *       security:
 *         - CookieAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slotId:
 *                   type: integer
 *               required:
 *                 - slotId
 *       responses:
 *         '200':
 *           description: Successfully left the slot
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
 *           description: Missing slot ID
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
 *         '500':
 *           description: Server error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 */
// POST /api/slots/join - Join a slot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { slotId } = await request.json();
    
    if (!slotId) {
      return NextResponse.json(
        { success: false, error: "Missing slot ID" },
        { status: 400 }
      );
    }

    // Check if the slot exists
    const slot = await prisma.interviewSlot.findUnique({
      where: { id: slotId },
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
        slot_id: slotId,
        user_id: Number(session.user.id),
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { success: false, error: "You are already participating in this slot" },
        { status: 400 }
      );
    }

    // Add the user as a participant for this slot
    const participant = await prisma.interviewParticipant.create({
      data: {
        slot_id: slotId,
        user_id: Number(session.user.id),
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: participant,
      message: "Successfully joined the slot"
    });
  } catch (error) {
    console.error("Error joining slot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to join slot" },
      { status: 500 }
    );
  }
}

// DELETE /api/slots/join - Leave a slot
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { slotId } = await request.json();
    
    if (!slotId) {
      return NextResponse.json(
        { success: false, error: "Missing slot ID" },
        { status: 400 }
      );
    }

    // Delete the participation record for this slot
    await prisma.interviewParticipant.deleteMany({
      where: {
        slot_id: slotId,
        user_id: Number(session.user.id),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Successfully left the slot"
    });
  } catch (error) {
    console.error("Error leaving slot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to leave slot" },
      { status: 500 }
    );
  }
}