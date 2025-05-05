import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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
 *                 - userId
 *                 - subscription
 *               properties:
 *                 userId:
 *                   type: integer
 *                   description: ID of the user
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
 *           description: Missing required fields
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
    const { userId, subscription } = await req.json();

    if (!userId || !subscription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingSubscription = await prisma.notificationEndpoint.findFirst({
      where: { user_id: userId, endpoint: subscription.endpoint },
    });

    if (!existingSubscription){
      await prisma.notificationEndpoint.create({
        data: {
          user_id: userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
      });
    }


    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}
