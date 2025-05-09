import type { NextApiRequest, NextApiResponse } from "next";
import { FileType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

/**
 * @swagger
 * /api/file-types:
 *   get:
 *     tags:
 *       - Files
 *     summary: Get all available file types
 *     description: Returns the list of file types from the FileType enum.
 *     responses:
 *       200:
 *         description: A list of file types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: Transkrip Nilai
 *                   key:
 *                     type: string
 *                     example: Transkrip_Nilai
 */
export async function GET() {
  try {
    const fileTypes = Object.values(FileType).map((key) => ({
        title: key.replace(/_/g, " "),
        key,
    }));

    return NextResponse.json(
      { success: true, data: fileTypes },
      { status: 200 }
    );
  } catch (error) {
      console.error("Error fetching students and files:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch data" },
        { status: 500 }
      );
  }
}
