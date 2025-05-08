import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/questions/delete:
 *   delete:
 *     summary: Delete a question by ID
 *     tags:
 *       - Questions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Question successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question deleted successfully"
 *       400:
 *         description: Bad request (missing or invalid ID)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Question ID is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error deleting question"
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { question_id } = body;

    if (!question_id || typeof question_id !== "number") {
      return NextResponse.json(
        { message: "Question ID is required" },
        { status: 400 }
      );
    }

    const existingQuestion = await prisma.questions.findUnique({
      where: { question_id },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { message: "Question not found" },
        { status: 404 }
      );
    }

    await prisma.questions.delete({
      where: { question_id },
    });

    return NextResponse.json(
      { message: "Question deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { message: "Error deleting question" },
      { status: 500 }
    );
  }
}