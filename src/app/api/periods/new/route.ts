// app/api/periods/new/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { period, start_date, end_date } = body;

    if (!period || !start_date || !end_date) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const newPeriod = await prisma.period.create({
      data: {
        period,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        is_current: false,
      },
    });

    return NextResponse.json(newPeriod, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error creating period" }, { status: 500 });
  }
}