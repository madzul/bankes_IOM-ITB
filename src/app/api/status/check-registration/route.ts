import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const studentId = Number(session.user.id);
    const body = await request.json();
    const { period_id } = body;

    if (!period_id || isNaN(Number(period_id))) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing period_id" },
        { status: 400 }
      );
    }

    const existingRecord = await prisma.status.findFirst({
      where: {
        student_id: studentId,
        period_id: Number(period_id),
      },
    });

    return NextResponse.json({ success: true, exists: !!existingRecord });
  } catch (error) {
    console.error("Error checking registration status:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}