import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/authOptions';

const prisma = new PrismaClient();

/**
 * @swagger
 * paths:
 *   /api/slots/{id}:
 *     get:
 *       tags:
 *         - Slots
 *       summary: Fetch a single interview slot by ID
 *       security:
 *         - CookieAuth: []
 *       parameters:
 *         - name: id
 *           in: path
 *           description: Numeric ID of the interview slot
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         '200':
 *           description: Slot retrieved successfully
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
 *           description: Invalid slot ID
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '401':
 *           description: Unauthorized access
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
 *     put:
 *       tags:
 *         - Slots
 *       summary: Update an interview slot
 *       security:
 *         - CookieAuth: []
 *       parameters:
 *         - name: id
 *           in: path
 *           description: Numeric ID of the interview slot
 *           required: true
 *           schema:
 *             type: integer
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
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
 *           description: Slot updated successfully
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
 *           description: Unauthorized access
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '403':
 *           description: Forbidden—only owner can update
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
 *       summary: Delete an interview slot
 *       security:
 *         - CookieAuth: []
 *       parameters:
 *         - name: id
 *           in: path
 *           description: Numeric ID of the interview slot
 *           required: true
 *           schema:
 *             type: integer
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
 *           description: Unauthorized access
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '403':
 *           description: Forbidden—only owner can delete
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
// GET /api/slots/[id] - Get a slot by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const slotId = Number(id);
    if (isNaN(slotId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid slot ID' },
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
        { success: false, error: 'Slot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: slot,
    });
  } catch (error) {
    console.error('Error fetching slot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch slot' },
      { status: 500 }
    );
  }
}

// PUT /api/slots/[id] - Update slot
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'Pengurus_IOM') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const slotId = Number(id);
    if (isNaN(slotId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid slot ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, start_time, end_time } = body;

    // Validation
    if (!start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slot exists and user is the owner
    const existingSlot = await prisma.interviewSlot.findUnique({
      where: { id: slotId },
    });

    if (!existingSlot) {
      return NextResponse.json(
        { success: false, error: 'Slot not found' },
        { status: 404 }
      );
    }

    if (existingSlot.user_id !== Number(session.user.id)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
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
    console.error('Error updating slot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update slot' },
      { status: 500 }
    );
  }
}

// DELETE /api/slots/[id] - Delete a slot
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'Pengurus_IOM') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const slotId = Number(id);
    if (isNaN(slotId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid slot ID' },
        { status: 400 }
      );
    }

    // Check if slot exists and user is the owner
    const existingSlot = await prisma.interviewSlot.findUnique({
      where: { id: slotId },
    });

    if (!existingSlot) {
      return NextResponse.json(
        { success: false, error: 'Slot not found' },
        { status: 404 }
      );
    }

    if (existingSlot.user_id !== Number(session.user.id)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the slot (will cascade to participants)
    await prisma.interviewSlot.delete({
      where: { id: slotId },
    });

    return NextResponse.json({
      success: true,
      message: 'Slot deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting slot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete slot' },
      { status: 500 }
    );
  }
}
