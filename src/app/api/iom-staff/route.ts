import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/iom-staff:
 *   get:
 *     summary: Get all IOM staff for the participant dropdown
 *     tags:
 *       - IOM
 *     responses:
 *       200:
 *         description: Successfully retrieved list of IOM staff
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
 *                       user_id:
 *                         type: integer
 *                         description: Unique identifier of the IOM staff user
 *                       name:
 *                         type: string
 *                         description: Full name of the IOM staff member
 *                       email:
 *                         type: string
 *                         description: Email address of the IOM staff member
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
 *         description: Server error while fetching IOM staff
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
 *                   example: "Failed to fetch IOM staff"
 */
// GET /api/iom-staff - Get all IOM staff for the participant dropdown
export async function GET() {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user?.id || (session.user.role !== "Pengurus_IOM" && session.user.role !== "Mahasiswa")) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
  
      const iomStaff = await prisma.user.findMany({
        where: { role: "Pengurus_IOM" },
        select: {
          user_id: true,
          name: true,
          email: true,
        },
      });
  
      return NextResponse.json({ success: true, data: iomStaff });
    } catch (error) {
      console.error("Error fetching IOM staff:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch IOM staff" },
        { status: 500 }
      );
    }
  }
