import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

/**
 * @swagger
 * paths:
 *   /api/notification/{id}/read:
 *     patch:
 *       tags:
 *         - Notifications
 *       summary: Mark a notification as read
 *       parameters:
 *         - name: id
 *           in: path
 *           description: ID of the notification to mark as read
 *           required: true
 *           schema:
 *             type: integer
 *       responses:
 *         '200':
 *           description: Notification marked as read successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     const: true
 *         '400':
 *           description: Invalid notification ID
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '500':
 *           description: Server error while updating notification
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
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