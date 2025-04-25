import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_: NextRequest, context: { params: { studentId: string } }) {
  try {
    const { studentId } = context.params;
    const id = parseInt(studentId, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    const files = await prisma.file.findMany({
      where: { student_id: id },
      select: {
        file_url: true,
        file_name: true,
        type: true,
      },
    });

    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
