import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  context: { params: { period_id: string } }
) {
  try {
    const { period_id } = context.params;
    const periodId = parseInt(period_id, 10);

    if (!periodId) {
      return NextResponse.json({ message: "Invalid period ID" }, { status: 400 });
    }

    // Reset all periods to `is_current = false`
    await prisma.period.updateMany({
      data: { is_current: false },
    });

    // Set the specified period as current
    const updatedPeriod = await prisma.period.update({
      where: { period_id: periodId },
      data: { is_current: true },
    });

    return NextResponse.json(updatedPeriod);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error setting current period" }, { status: 500 });
  }
}