import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/form:
 *   post:
 *     summary: Retrieve saved interview form notes for a specific period
 *     tags:
 *       - Forms
 *     security:
 *       - CookieAuth: []
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    const allowedRoles = ["Pengurus_IOM", "Pewawancara"];
    if (!session?.user?.id || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { period_id } = await request.json();
    const slotId = Number(period_id);
    if (!slotId || isNaN(slotId)) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing period_id" },
        { status: 400 }
      );
    }

    // Build the base filter for this slot
    const whereClause: any = {
      slot: { id: slotId },
    };

    // If the user is a Pewawancara, restrict to notes on their own slots
    if (session.user.role === "Pewawancara") {
      whereClause.slot.user_id = parseInt(session.user.id, 10);
    }

    // Apply the whereClause here
    const notes = await prisma.notes.findMany({
      where: whereClause,
      select: {
        text: true,
        student: {
          select: {
            nim: true,
            User: { select: { name: true } },
          },
        },
      },
    });

    const formatted = notes.map((note) => ({
      text: note.text,
      nim: note.student.nim,
      userName: note.student.User.name,
    }));
    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching form interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
