import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/periods:
 *   get:
 *     summary: Retrieve a list of all academic periods
 *     tags:
 *       - Periods
 *     responses:
 *       200:
 *         description: A list of academic periods
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Period'
 *       500:
 *         description: Server error fetching periods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching periods"
 */
export async function GET() {
  try {
    const periods = await prisma.period.findMany();
    return NextResponse.json(periods);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error fetching periods" }, { status: 500 });
  }
}