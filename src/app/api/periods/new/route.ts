// app/api/periods/new/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();


/**
 * @swagger
 * /api/periods/new:
 *   post:
 *     summary: Create a new academic period
 *     tags:
 *       - Periods
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period:
 *                 type: string
 *                 description: Academic period name/identifier (e.g., "2024/2025")
 *               start_date:
 *                 type: string
 *                 format: date-time
 *                 description: ISO 8601 formatted start datetime of the period
 *               end_date:
 *                 type: string
 *                 format: date-time
 *                 description: ISO 8601 formatted end datetime of the period
 *             required:
 *               - period
 *               - start_date
 *               - end_date
 *     responses:
 *       201:
 *         description: Newly created period
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Period'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields"
 *       500:
 *         description: Server error creating period
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error creating period"
 */

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "Admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { period, start_date, end_date } = body;

    if (!period || !start_date || !end_date) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const newPeriod = await prisma.period.create({
      data: {
        period,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        is_current: false,
        is_open: false,
      },
    });

    return NextResponse.json(newPeriod, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error creating period" }, { status: 500 });
  }
}