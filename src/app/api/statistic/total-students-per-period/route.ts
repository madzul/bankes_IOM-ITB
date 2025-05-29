import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Statistic
 *   description: Endpoints related to statistical reports
 *
 * /api/statistic/total-students-per-period:
 *   get:
 *     summary: Get total students grouped by faculty for a given period
 *     tags:
 *       - Statistic
 *     parameters:
 *       - in: query
 *         name: selectedPeriod
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the selected period
 *     responses:
 *       '200':
 *         description: Successfully retrieved student counts grouped by faculty
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       faculty:
 *                         type: string
 *                         example: "STEI"
 *                       student_count:
 *                         type: integer
 *                         example: 42
 *       '400':
 *         description: Missing or invalid selectedPeriod parameter
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
 *                   example: Invalid or missing selectedPeriod
 *       '401':
 *         description: Unauthorized request
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
 *                   example: Unauthorized
 *       '500':
 *         description: Internal server error
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
 *                   example: Server Error
 */

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const selectedPeriod = req.nextUrl.searchParams.get("selectedPeriod");

  if (!selectedPeriod || isNaN(Number(selectedPeriod))) {
    return NextResponse.json({ success: false, error: "Invalid or missing selectedPeriod" }, { status: 400 });
  }

  try {
    const data = await prisma.student.groupBy({
      by: ['faculty'],
      where: {
        Statuses: {
          some: {
            period_id: Number(selectedPeriod),
          },
        },
      },
      _count: {
        _all: true,
      },
    });

    const formatted = data.map((item) => ({
      faculty: item.faculty,
      student_count: item._count._all,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error in total-students-per-period API:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
