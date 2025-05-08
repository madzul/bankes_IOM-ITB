import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/score-matrix:
 *   get:
 *     summary: Fetch all score matrix entries for a given student and period
 *     tags:
 *       - ScoreMatrix
 *     parameters:
 *       - in: query
 *         name: student_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: period_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: A list of score matrix entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ScoreMatrix'
 *       400:
 *         description: Missing required query parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "student_id and period_id are required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching score matrix"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const student_id = parseInt(searchParams.get("student_id") || "", 10);
    const period_id = parseInt(searchParams.get("period_id") || "", 10);

    if (isNaN(student_id) || isNaN(period_id)) {
      return NextResponse.json(
        { message: "student_id and period_id are required" },
        { status: 400 }
      );
    }

    const scores = await prisma.scoreMatrix.findMany({
      where: {
        student_id,
        period_id,
      },
      include: {
        Question: {
          select: {
            question_id: true,
            question: true,
          },
        },
      },
    });

    return NextResponse.json(scores, { status: 200 });
  } catch (error) {
    console.error("Error fetching score matrix:", error);
    return NextResponse.json(
      { message: "Error fetching score matrix" },
      { status: 500 }
    );
  }
}