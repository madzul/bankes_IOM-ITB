import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface IOM_Notification {
  notification_id: number;
  user_id: number;
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
 *       parameters:
 *         - name: userId
 *           in: query
 *           description: ID of the user to fetch notifications for
 *           required: true
 *           schema:
 *             type: integer
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
 *         '400':
 *           description: Missing userId
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
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const notifications = await prisma.notification.findMany({
    where: { user_id: Number(userId) },
    orderBy: { created_at: "desc" },
  }) as IOM_Notification[];

  return NextResponse.json({ notifications });
}
