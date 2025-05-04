import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const periods = await prisma.period.findMany();
    return NextResponse.json(periods);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error fetching periods" }, { status: 500 });
  }
}