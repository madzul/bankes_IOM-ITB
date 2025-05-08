import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * paths:
 *   /api/notification/subscribe:
 *     post:
 *       tags:
 *         - Notifications
 *       summary: Subscribe a user to push notifications
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - subscription
 *               properties:
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     endpoint:
 *                       type: string
 *                     keys:
 *                       type: object
 *                       properties:
 *                         p256dh:
 *                           type: string
 *                         auth:
 *                           type: string
 *       responses:
 *         '200':
 *           description: Subscription saved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *         '400':
 *           description: Missing subscription object
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '401':
 *           description: Unauthorized
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '500':
 *           description: Server error while saving subscription
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
  
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { subscription } = await req.json();

    if (!subscription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const studentId = Number(session.user.id)

    await prisma.notificationEndpoint.create({
      data: {
        user_id: studentId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}
