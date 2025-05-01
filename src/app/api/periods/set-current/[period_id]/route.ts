import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/periods/set-current/{period_id}:
 *   put:
 *     summary: Set the specified academic period as current
 *     tags:
 *       - Periods
 *     parameters:
 *       - in: path
 *         name: period_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the period to set as current
 *     responses:
 *       200:
 *         description: Period successfully set as current
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Period'
 *       400:
 *         description: Invalid period ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid period ID"
 *       500:
 *         description: Server error setting current period
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error setting current period"
 */
export async function PUT(
  request: Request,
  context: { params: { period_id: string } }
) {
  try {
    const { period_id } = await context.params;
    const periodId = parseInt(period_id, 10);

    if (!periodId) {
      return NextResponse.json({ message: "Invalid period ID" }, { status: 400 });
    }

    await prisma.period.updateMany({
      data: { 
        is_current: false,
        is_open: false,
      },
    });

    const updatedPeriod = await prisma.period.update({
      where: { period_id: periodId },
      data: { is_current: true },
    });

    return NextResponse.json(updatedPeriod);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error setting current period" }, { status: 500 });
  }
}