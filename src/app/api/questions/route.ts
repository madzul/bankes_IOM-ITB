import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Retrieve a list of all questions
 *     tags:
 *       - Questions
 *     responses:
 *       200:
 *         description: A JSON array of questions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Question'
 *       500:
 *         description: Server error fetching questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching questions"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Question:
 *       type: object
 *       properties:
 *         question_id:
 *           type: integer
 *           description: Unique identifier of the question
 *           example: 1
 *         question:
 *           type: string
 *           description: The content of the question
 *           example: "Jelaskan kenapa kamu berhak mendapatkan beasiswa ini?"
 */

export async function GET() {
  try {
    const questions = await prisma.questions.findMany();
    return NextResponse.json(questions);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error fetching questions" }, { status: 500 });
  }
}

