import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/interviews/{id}:
 *   get:
 *     summary: Get an interview by ID
 *     tags:
 *       - Interviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the interview to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved the interview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Interview'
 *       400:
 *         description: Invalid interview ID
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
 *                   example: "Invalid interview ID"
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
 *         description: Interview not found
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
 *                   example: "Interview not found"
 *       500:
 *         description: Server error fetching interview
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
 *                   example: "Failed to fetch interview"
 *
 *   patch:
 *     summary: Update the max_students of an interview
 *     tags:
 *       - Interviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the interview to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               max_students:
 *                 type: integer
 *                 description: New maximum number of students (must be ≥1)
 *             required:
 *               - max_students
 *     responses:
 *       200:
 *         description: Successfully updated max_students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Interview'
 *       400:
 *         description: Invalid input or interview ID
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
 *                   example: "Invalid max_students value"
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
 *       403:
 *         description: Forbidden (not the owner)
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
 *         description: Interview not found
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
 *                   example: "Interview not found"
 *       500:
 *         description: Server error updating interview
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
 *                   example: "Failed to update interview"
 *
 *   put:
 *     summary: Update interview details and regenerate slots
 *     tags:
 *       - Interviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the interview to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               max_students:
 *                 type: integer
 *             required:
 *               - start_time
 *               - end_time
 *               - max_students
 *     responses:
 *       200:
 *         description: Interview updated and slots regenerated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     interview:
 *                       $ref: '#/components/schemas/Interview'
 *                     slots:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InterviewSlot'
 *       400:
 *         description: Invalid input or interview ID
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
 *                   example: "Missing required fields"
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
 *       403:
 *         description: Forbidden (not the owner)
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
 *         description: Interview not found
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
 *                   example: "Interview not found"
 *       500:
 *         description: Server error updating interview
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
 *                   example: "Failed to update interview"
 *
 *   delete:
 *     summary: Delete an interview
 *     tags:
 *       - Interviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the interview to delete
 *     responses:
 *       200:
 *         description: Interview deleted successfully
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
 *                   example: "Interview deleted successfully"
 *       400:
 *         description: Invalid interview ID
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
 *                   example: "Invalid interview ID"
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
 *       403:
 *         description: Forbidden (not the owner)
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
 *         description: Interview not found
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
 *                   example: "Interview not found"
 *       500:
 *         description: Server error deleting interview
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
 *                   example: "Failed to delete interview"
 */
// GET /api/interviews/[id] - Get an interview by ID
export async function GET(
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

    const interview = await prisma.interview.findUnique({
      where: { interview_id: interviewId },
      include: {
        slots: true,
        participants: true,
      },
    });

    if (!interview) {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: interview,
    });
  } catch (error) {
    console.error("Error fetching interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch interview" },
      { status: 500 }
    );
  }
}

// PATCH /api/interviews/[id] - Update max_students
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

    const interviewId = Number(params.id);
    if (isNaN(interviewId)) {
      return NextResponse.json(
        { success: false, error: "Invalid interview ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { max_students } = body;

    if (typeof max_students !== 'number' || max_students < 1) {
      return NextResponse.json(
        { success: false, error: "Invalid max_students value" },
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

    if (existingInterview.user_id !== Number(session.user.id)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update the interview with new max_students value
    const updatedInterview = await prisma.interview.update({
      where: { interview_id: interviewId },
      data: {
        max_students,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedInterview,
    });
  } catch (error) {
    console.error("Error updating interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update interview" },
      { status: 500 }
    );
  }
}


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

    // Parse the main start and end times
    const baseStartDateTime = new Date(start_time);
    const baseEndDateTime = new Date(end_time);
    
    // Calculate the duration for each slot in milliseconds
    const slotDurationMs = baseEndDateTime.getTime() - baseStartDateTime.getTime();

    // Delete existing slots (this will also remove student bookings)
    await prisma.interviewSlot.deleteMany({
      where: { interview_id: interviewId },
    });

    // Create new contiguous slots
    const slots = [];
    for (let i = 0; i < max_students; i++) {
      // Each slot starts right after the previous one
      const slotStartTime = new Date(baseStartDateTime.getTime() + (i * slotDurationMs));
      const slotEndTime = new Date(slotStartTime.getTime() + slotDurationMs);

      const slot = await prisma.interviewSlot.create({
        data: {
          interview_id: interviewId,
          slot_number: i + 1,
          start_time: slotStartTime,
          end_time: slotEndTime,
        },
      });
      slots.push(slot);
    }

    // Update interview with new total time range
    const updatedInterview = await prisma.interview.update({
      where: { interview_id: interviewId },
      data: {
        title,
        description,
        start_time: baseStartDateTime,
        // The end time of the interview is now the end of the last slot
        end_time: new Date(baseStartDateTime.getTime() + (slotDurationMs * max_students)),
        max_students,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        interview: updatedInterview,
        slots,
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
  