import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/status/new:
 *   post:
 *     tags:
 *       - Registration Status
 *     summary: Register student for academic period
 *     description: Creates a new registration status record with default values
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - period_id
 *             properties:
 *               period_id:
 *                 type: integer
 *                 description: Academic period identifier
 *                 example: 2023
 *     responses:
 *       201:
 *         description: Successfully created status record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Status'
 *       400:
 *         description: Invalid request parameters
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
 *                   example: "Invalid or missing period_id"
 *       401:
 *         description: Unauthorized access
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
 *         description: Server error
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
 *                   example: "Internal Server Error"
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     Status:
 *       type: object
 *       properties:
 *         student_id:
 *           type: integer
 *           description: Composite ID part - References Student
 *         period_id:
 *           type: integer
 *           description: Composite ID part - References Period
 *         passDitmawa:
 *           type: boolean
 *           default: false
 *         passIOM:
 *           type: boolean
 *           default: false
 *         passInterview:
 *           type: boolean
 *           default: false
 *         amount:
 *           type: integer
 *           nullable: true
 *           description: Nullable monetary amount
 *         Student:
 *           $ref: '#/components/schemas/Student'
 *         Period:
 *           $ref: '#/components/schemas/Period'
 *       required:
 *         - student_id
 *         - period_id
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       properties:
 *         student_id:
 *           type: integer
 *           description: Auto-generated unique identifier for the student
 *           example: 1001
 *         nim:
 *           type: string
 *           description: Student's National Identification Number
 *           example: "202107001"
 *         faculty:
 *           type: string
 *           description: Faculty where the student is enrolled
 *           example: "Computer Science"
 *         major:
 *           type: string
 *           description: Student's academic major
 *           example: "Software Engineering"
 *       required:
 *         - student_id
 *         - nim
 *         - faculty
 *         - major
 */


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const studentId = Number(session.user.id);

    const body = await request.json();
    const { period_id } = body;

    if (!period_id || isNaN(Number(period_id))) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing period_id" },
        { status: 400 }
      );
    }

    const newStatus = await prisma.status.create({
      data: {
        student_id: studentId,
        period_id: Number(period_id),
        passDitmawa: false,
        passIOM: false,
        passInterview: false,
        amount: null,
      },
    });

    return NextResponse.json({ success: true, data: newStatus }, { status: 201 });
  } catch (error) {
    console.error("Error creating status record:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}