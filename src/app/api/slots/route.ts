import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * paths:
 *   /api/slots:
 *     get:
 *       tags:
 *         - Slots
 *       summary: Get all interview slots
 *       security:
 *         - CookieAuth: []
 *       responses:
 *         '200':
 *           description: A list of interview slots
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     const: true
 *                   data:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         title:
 *                           type: string
 *                         description:
 *                           type: string
 *                         start_time:
 *                           type: string
 *                           format: date-time
 *                         end_time:
 *                           type: string
 *                           format: date-time
 *                         user_id:
 *                           type: integer
 *                         period_id:
 *                           type: integer
 *                         User:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *                         Participants:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               User:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                   email:
 *                                     type: string
 *                         Student:
 *                           type: object
 *                           properties:
 *                             User:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *         '401':
 *           description: Unauthorized access
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '403':
 *           description: Forbidden access
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
 *     post:
 *       tags:
 *         - Slots
 *       summary: Create a new interview slot
 *       security:
 *         - CookieAuth: []
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
 *       responses:
 *         '200':
 *           description: Slot created successfully
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
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       start_time:
 *                         type: string
 *                         format: date-time
 *                       end_time:
 *                         type: string
 *                         format: date-time
 *                       user_id:
 *                         type: integer
 *                       period_id:
 *                         type: integer
 *         '400':
 *           description: Missing required fields
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
 *           description: No active period found
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '500':
 *           description: Failed to create slot
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/slots - Get all slots
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = session.user.role;

    // Different views based on role
    if (userRole === "Pengurus_IOM" || userRole === "Pewawancara") {
      // IOM staff can see all slots
      const slots = await prisma.interviewSlot.findMany({
        include: {
          User: {
            select: {
              name: true,
              email: true,
            },
          },
          Participants: {
            include: {
              User: {
                select: {
                  name: true,
                  email: true,
                },
              },
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
      return NextResponse.json({ success: true, data: slots });
    } else if (userRole === "Mahasiswa") {
      // Students only see available slots and their own bookings
      const currentPeriod = await prisma.period.findFirst({
        where: { is_current: true },
      });

      if (!currentPeriod) {
        return NextResponse.json(
          { success: false, error: "No active period found" },
          { status: 404 }
        );
      }

      // Get all slots in the current period
      const slots = await prisma.interviewSlot.findMany({
        where: {
          period_id: currentPeriod.period_id,
        },
        include: {
          User: {
            select: {
              name: true,
            },
          },
          Participants: {
            include: {
              User: {
                select: {
                  name: true,
                },
              },
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

      return NextResponse.json({ success: true, data: slots });
    } else {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch slots" },
      { status: 500 }
    );
  }
}

// POST /api/slots - Create new slot
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const allowedRoles = ["Pengurus_IOM", "Pewawancara"];
    if (!session?.user?.id || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
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

    // Get the current period
    const currentPeriod = await prisma.period.findFirst({
      where: { is_current: true },
    });

    if (!currentPeriod) {
      return NextResponse.json(
        { success: false, error: "No active period found" },
        { status: 404 }
      );
    }

    // Create a new slot
    const slot = await prisma.interviewSlot.create({
      data: {
        title,
        description,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        user_id: Number(session.user.id),
        period_id: currentPeriod.period_id,
      },
    });

    return NextResponse.json({
      success: true,
      data: slot,
    });
  } catch (error) {
    console.error("Error creating slot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create slot" },
      { status: 500 }
    );
  }
}