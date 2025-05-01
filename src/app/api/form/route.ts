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

    const notes = await prisma.notes.findMany({
      where: {
        interview: {
            period_id: Number(period_id),
        },
      },
      select: {
        text: true,
        student: {
          select: {
            nim: true,
          },
        },
        interview: {
          select: {
            User: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const formatted = notes.map(note => ({
      text: note.text,
      nim: note.student.nim,
      userName: note.interview.User.name
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