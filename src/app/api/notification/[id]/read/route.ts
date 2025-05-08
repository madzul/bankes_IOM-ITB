import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * paths:
 *   /api/notification/{id}/read:
 *     patch:
 *       tags:
 *         - Notifications
 *       summary: Mark a notification as read
 *       security: 
 *         - CookieAuth: []
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
 *         '401':
 *           description: Unauthorized (session missing)
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '403':
 *           description: Notification not found
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
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params
  const notificationId = Number(id);

  if (isNaN(notificationId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const studentId = Number(session.user.id);

  // Perform update only if the user owns the notification
  const updatedNotification = await prisma.notification.updateMany({
    where: {
      notification_id: notificationId,
      user_id: studentId,
    },
    data: { has_read: true },
  });

  if (updatedNotification.count === 0) {
    return NextResponse.json({ error: "Notification not found" }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}