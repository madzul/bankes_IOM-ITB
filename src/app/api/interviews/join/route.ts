import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/interviews/join:
 *   post:
 *     summary: Join a specific interview slot
 *     tags:
 *       - Interviews
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interviewId:
 *                 type: integer
 *                 description: ID of the interview to join
 *               slotId:
 *                 type: integer
 *                 description: ID of the specific slot to join
 *             required:
 *               - interviewId
 *               - slotId
 *     responses:
 *       200:
 *         description: Successfully joined the interview slot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InterviewParticipant'
 *                 message:
 *                   type: string
 *                   example: "Successfully joined the interview slot"
 *       400:
 *         description: Missing interview ID or slot ID, or already participating
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Missing interview ID or slot ID"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Slot not found or doesn't belong to specified interview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Slot not found or doesn't belong to specified interview"
 *       500:
 *         description: Server error joining interview slot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to join interview slot"
 *
 *   delete:
 *     summary: Leave a specific interview slot or entire interview
 *     tags:
 *       - Interviews
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interviewId:
 *                 type: integer
 *                 description: ID of the interview to leave
 *               slotId:
 *                 type: integer
 *                 description: ID of the specific slot to leave (optional)
 *     responses:
 *       200:
 *         description: Successfully left the interview slot or interview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successfully left the interview slot"
 *       400:
 *         description: Missing interview ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Missing interview ID"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Server error leaving interview slot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to leave interview slot"
 */

// POST /api/interviews/join - Join a specific interview slot
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

    // Check if the slot exists
    const slot = await prisma.interviewSlot.findUnique({
      where: { id: slotId },
      include: {
        Interview: {
          select: {
            interview_id: true,
          },
        },
      },
    });

    if (!slot || slot.Interview.interview_id !== interviewId) {
      return NextResponse.json(
        { success: false, error: "Slot not found or doesn't belong to specified interview" },
        { status: 404 }
      );
    }

    // Check if the user is already a participant for this slot
    const existingParticipant = await prisma.interviewParticipant.findFirst({
      where: {
        interview_id: interviewId,
        user_id: Number(session.user.id),
        slot_id: slotId,
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
        slot_id: slotId,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: participant,
      message: "Successfully joined the interview slot"
    });
  } catch (error) {
    console.error("Error joining interview slot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to join interview slot" },
      { status: 500 }
    );
  }
}

// DELETE /api/interviews/join - Leave a specific interview slot
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { interviewId, slotId } = await request.json();
    
    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: "Missing interview ID" },
        { status: 400 }
      );
    }

    // Delete the participation record for this specific slot
    // This is the key change - adding the slot_id filter
    await prisma.interviewParticipant.deleteMany({
      where: {
        interview_id: interviewId,
        user_id: Number(session.user.id),
        ...(slotId ? { slot_id: slotId } : {})
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: slotId ? "Successfully left the interview slot" : "Successfully left the interview"
    });
  } catch (error) {
    console.error("Error leaving interview slot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to leave interview slot" },
      { status: 500 }
    );
  }
}