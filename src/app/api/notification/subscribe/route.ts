import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/notification/subscribe:
 *   post:
 *     summary: Save a push notification subscription for a user
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *               subscription:
 *                 type: object
 *                 properties:
 *                   endpoint:
 *                     type: string
 *                   keys:
 *                     type: object
 *                     additionalProperties:
 *                       type: string
 *             required:
 *               - userId
 *               - subscription
 *     responses:
 *       200:
 *         description: Subscription saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing required fields"
 *       500:
 *         description: Server error saving subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to save subscription"
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
