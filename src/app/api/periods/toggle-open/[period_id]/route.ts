import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/periods/toggle-open/{period_id}:
 *   put:
 *     summary: Toggle open status for a period and close others
 *     description: Sets specified period as open (true) and closes all other periods
 *     tags: [Periods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: period_id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Numeric ID of the period to open
 *     responses:
 *       200:
 *         description: Successfully updated period open status (other periods closed)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Period'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   examples:
 *                     - "Invalid period ID"
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
 *         description: Server error updating open status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error toggling period open status"
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