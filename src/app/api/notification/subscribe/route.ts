import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
