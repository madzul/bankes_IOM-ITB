import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import webPush from "web-push";

const prisma = new PrismaClient();

webPush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, title, body } = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subscriptions = await prisma.notificationEndpoint.findMany({
      where: { user_id: userId },
    });

    const notifications = subscriptions.map((sub) => {
      if (!sub.keys || typeof sub.keys !== "object") {
        console.error("Invalid keys format for subscription:", sub);
        return Promise.resolve(); // Skip invalid subscriptions
      }

      const pushSubscription: webPush.PushSubscription = {
        endpoint: sub.endpoint,
        keys: sub.keys as { p256dh: string; auth: string },
      };

      return webPush.sendNotification(pushSubscription, JSON.stringify({ title, body }));
    });

    await Promise.all(notifications);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
