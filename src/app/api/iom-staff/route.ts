import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * paths:
 *   /api/iom-staff:
 *     get:
 *       tags:
 *         - IOM
 *       summary: Fetch all IOM staff users
 *       security:
 *         - CookieAuth: []
 *       responses:
 *         '200':
 *           description: A list of IOM staff members
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     const: true
 *                   data:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *         '401':
 *           description: Not authenticated or unauthorized role
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '500':
 *           description: Server error
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
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
