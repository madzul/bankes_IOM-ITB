import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/interviews/slots/{id}/book:
 *   post:
 *     summary: Book an interview slot
 *     tags:
 *       - InterviewSlots
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the slot to book
 *     responses:
 *       200:
 *         description: Slot successfully booked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/InterviewSlot'
 *       400:
 *         description: Invalid slot ID, slot already booked, or existing booking conflict
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
 *                   example: "Slot already booked"
 *                 existingSlotId:
 *                   type: integer
 *                   description: ID of previously booked slot when conflict occurs
 *       401:
 *         description: Unauthorized (student role required)
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
 *         description: Slot not found
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
 *                   example: "Slot not found"
 *       500:
 *         description: Server error booking slot
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
 *                   example: "Failed to book slot"
 */
// POST /api/interviews/slots/[id]/book - Book an interview slot
export async function POST(
    // request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user?.id || session.user.role !== "Mahasiswa") {
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
  
      // Check if student has already booked another slot in the same interview
      const existingBooking = await prisma.interviewSlot.findFirst({
        where: {
          interview_id: slot.interview_id,
          student_id: Number(session.user.id),
        },
      });
  
      if (existingBooking) {
        return NextResponse.json(
          { 
            success: false, 
            error: "You already have a booking for this interview session",
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

      await prisma.notes.create({
        data: {
          interview_id : slot.interview_id,
          student_id : Number(session.user.id),
          text : JSON.stringify({
            namaPewawancara:"",
            noHpPewawancara:"",
            namaMahasiswa:"",
            nimMahasiswa:"",
          })
        }
      })
  
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