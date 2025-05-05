import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/periods/current:
 *   get:
 *     summary: Get the current active academic period
 *     tags:
 *       - Periods
 *     responses:
 *       200:
 *         description: Successfully retrieved the current active period
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Period'
 *       404:
 *         description: No current period found
 *       500:
 *         description: Server error while fetching the current period
 */
export async function GET() {
  try {
    const currentPeriod = await prisma.period.findFirst({
      where: { is_current: true },
    });
    return NextResponse.json(currentPeriod || null);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error fetching current period" }, { status: 500 });
  }
}