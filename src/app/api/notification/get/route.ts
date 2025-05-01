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
 * /api/notification/get:
 *   get:
 *     summary: Retrieve notifications for a specific user
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user whose notifications are to be fetched
 *     responses:
 *       200:
 *         description: A list of notifications for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Missing or invalid userId parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing userId"
 *       500:
 *         description: Server error fetching notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error fetching notifications"
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
