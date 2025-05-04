import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const currentPeriod = await prisma.period.findFirst({
      where: { is_current: true },
    });
    return NextResponse.json(currentPeriod || null);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error fetching current period" }, { status: 500 });
  }
}