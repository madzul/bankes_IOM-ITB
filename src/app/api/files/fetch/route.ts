import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/files/fetch:
 *   post:
 *     summary: Fetch student status and associated files for a given period
 *     tags:
 *       - Files
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period_id:
 *                 type: integer
 *                 description: ID of the academic period
 *             required:
 *               - period_id
 *     responses:
 *       200:
 *         description: Successfully retrieved student status and files
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
 *                       student_id:
 *                         type: integer
 *                       period_id:
 *                         type: integer
 *                       passDitmawa:
 *                         type: boolean
 *                       passIOM:
 *                         type: boolean
 *                       Student:
 *                         type: object
 *                         properties:
 *                           nim:
 *                             type: string
 *                           User:
 *                             type: object
 *                             properties:
 *                               user_id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           Files:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 file_id:
 *                                   type: integer
 *                                 student_id:
 *                                   type: integer
 *                                 file_url:
 *                                   type: string
 *                                 file_name:
 *                                   type: string
 *                                 type:
 *                                   type: string
 *       400:
 *         description: Invalid or missing period_id
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
 *                   example: "Invalid or missing period_id"
 *       403:
 *         description: Forbidden (insufficient permissions)
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
 *         description: Server error fetching data
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
 *                   example: "Failed to fetch data"
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { period_id } = body;

    if (!period_id || isNaN(Number(period_id))) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing period_id" },
        { status: 400 }
      );
    }

    const studentData = await prisma.status.findMany({
      where: {
        period_id: Number(period_id),
      },
      select: {
        student_id: true,
        period_id: true,
        passDitmawa: true,
        passIOM: true,
        Student: {
          select: {
            nim: true,
            User: {
              select: {
                user_id: true,
                name: true,
              },
            },
            Files: {
              select: {
                file_id: true,
                student_id: true,
                file_url: true,
                file_name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: studentData });
  } catch (error) {
    console.error("Error fetching students and files:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
