import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface IOM_Notification {
  notification_id: number;
  user_id: number;
  header: string;
  body: string;
  url: string | null;
  has_read: boolean;
  created_at: Date;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const notifications = await prisma.notification.findMany({
    where: { user_id: Number(userId) },
    orderBy: { created_at: "desc" },
  }) as IOM_Notification[];

  return NextResponse.json({ notifications });
}
