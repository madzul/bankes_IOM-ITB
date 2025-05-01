import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/notification/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags:
 *       - Notifications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the notification to mark as read
 *     responses:
 *       200:
 *         description: Notification successfully marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid notification ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid ID"
 *       500:
 *         description: Server error marking notification as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error marking notification as read"
 */

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const notificationId = Number(params.id);

  if (isNaN(notificationId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }


  await prisma.notification.update({
    where: { notification_id: notificationId },
    data: { has_read: true },
  });

  return NextResponse.json({ success: true });
}