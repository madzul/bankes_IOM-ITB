// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Student:
 *       type: object
 *       properties:
 *         student_id:
 *           type: integer
 *           description: Unique student identifier (matches user_id)
 *         nim:
 *           type: string
 *           description: Student's identification number
 *         faculty:
 *           type: string
 *           description: Student's faculty/department
 *         major:
 *           type: string
 *           description: Student's study program
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *       required:
 *         - student_id
 *         - nim
 *         - faculty
 *         - major
 */

/**
 * @swagger
 * /api/student/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Get student details
 *     description: Retrieve student academic information and related metadata
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric student ID
 *     responses:
 *       200:
 *         description: Student details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Student not found
 *       500:
 *         description: Server error
 */
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = (await context.params).id;
  const userId = parseInt(params, 10);

  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { student_id: userId },
    });

    if (!student) {
      return NextResponse.json({ error: "student not found" }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}