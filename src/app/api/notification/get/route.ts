import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

interface IOM_Notification {
  notification_id: number;
  header: string;
  body: string;
  url: string | null;
  has_read: boolean;
  created_at: Date;
}

/**
 * @swagger
 * paths:
 *   /api/notification/get:
 *     get:
 *       tags:
 *         - Notifications
 *       summary: Get notifications for a user
 *       responses:
 *         '200':
 *           description: List of notifications retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   notifications:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Notification'
 *         '401':
 *           description: Unauthorized (session missing)
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '500':
 *           description: Server error while fetching notifications
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const studentId = Number(session.user.id);

  const notifications = await prisma.notification.findMany({
    where: { user_id: studentId },
    orderBy: { created_at: "desc" },
    select: {
      notification_id: true,
      header: true,
      body: true,
      url: true,
      has_read: true,
      created_at: true,
    },
  }) as IOM_Notification[];

  return NextResponse.json({ notifications });
}
