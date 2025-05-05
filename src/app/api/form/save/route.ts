import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();
/**
 * @swagger
 * /api/form/save:
 *   post:
 *     summary: Retrieve saved interview form notes for a specific period
 *     tags:
 *       - Forms
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
 *         description: Successfully fetched form notes
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
 *                       text:
 *                         type: string
 *                         description: JSON string of interview notes fields
 *                       nim:
 *                         type: string
 *                         description: Student NIM (identifier)
 *                       userName:
 *                         type: string
 *                         description: Name of the interviewer
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { periods, nim, formData } = await request.json()

    if (!nim || !formData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(periods[0].period_id,);
    console.log(nim,);
    console.log(formData,);

    const notes = await prisma.notes.findFirst({
      where: {
        interview_id: periods[0].period_id,
        student_id: Number(nim),
      }
    })

    return NextResponse.json({
      success: true,
      data: notes,
    })
  } catch (error) {
    console.error("Error saving form data:", error)
    return NextResponse.json({ success: false, error: "Failed to save form data" }, { status: 500 })
  }
}