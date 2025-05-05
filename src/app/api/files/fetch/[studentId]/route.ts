import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/files/fetch/{studentId}:
 *   get:
 *     summary: Retrieve all files for a specific student
 *     tags:
 *       - Files
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the student whose files are to be fetched
 *     responses:
 *       200:
 *         description: A list of files belonging to the student
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   file_url:
 *                     type: string
 *                     description: URL of the uploaded file
 *                   file_name:
 *                     type: string
 *                     description: Name of the file stored in MinIO
 *                   type:
 *                     type: string
 *                     description: Document type (e.g., KTM, KTP)
 *       400:
 *         description: Invalid student ID provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid student ID"
 *       500:
 *         description: Server error fetching files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
export async function GET(_: NextRequest, context: { params: { studentId: string } }) {
  try {
    const { studentId } = context.params;
    const id = parseInt(studentId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    const files = await prisma.file.findMany({
      where: { student_id: id },
      select: {
        file_url: true,
        file_name: true,
        type: true,
      },
    });

    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
