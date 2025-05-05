import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/periods/toggle-open/{period_id}:
 *   put:
 *     summary: Set the specified academic period as open for registration
 *     tags:
 *       - Periods
 *     parameters:
 *       - in: path
 *         name: period_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the period to open
 *     responses:
 *       200:
 *         description: Period successfully opened for registration
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
 *         description: Server error toggling period open status
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
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "Admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const { period_id } = context.params;
    const periodId = parseInt(period_id, 10);

    if (!periodId) {
      return NextResponse.json({ message: "Invalid period ID" }, { status: 400 });
    }

    await prisma.period.updateMany({
      data: { is_open: false },
    });

    const updatedPeriod = await prisma.period.update({
      where: { period_id: periodId },
      data: { is_open: true },
    });

    return NextResponse.json(updatedPeriod);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error setting current period" }, { status: 500 });
  }
}