import { PrismaClient } from "@prisma/client";
import webPush from "web-push";

const prisma = new PrismaClient();

webPush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  userId: number,
  title: string,
  body: string,
  url?: string // <- optional
) {
  if (!userId || !title || !body) {
    throw new Error("Missing required fields");
  }

  // Store in DB first
  const createdNotification = await prisma.notification.create({
    data: {
      user_id: userId,
      header: title,
      body,
      url,
      has_read : false,
    },
  });

  // Get subscriptions
  const subscriptions = await prisma.notificationEndpoint.findMany({
    where: { user_id: userId },
  });

  const payload = JSON.stringify({ title, body, url, notificationId: createdNotification.notification_id, });

  const notifications = subscriptions.map((sub) => {
    if (!sub.keys || typeof sub.keys !== "object") {
      console.error("Invalid keys format for subscription:", sub);
      return Promise.resolve(); // Skip invalid subscriptions
    }

    const pushSubscription: webPush.PushSubscription = {
      endpoint: sub.endpoint,
      keys: sub.keys as { p256dh: string; auth: string },
    };

    return webPush.sendNotification(pushSubscription, payload);
  });

  await Promise.all(notifications);
}
