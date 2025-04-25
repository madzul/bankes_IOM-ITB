import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

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