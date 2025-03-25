import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, context: { params: { studentId: string } }) {
  try {
    const { studentId } = context.params;
    const id = parseInt(studentId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    const files = await prisma.file.findMany({
      where: { student_id: id, period_id: 1},
      select: {
        file_url: true,
        file_name: true,
        type: true
      },
    });

    return NextResponse.json(files, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
