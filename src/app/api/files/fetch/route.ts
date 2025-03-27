import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { period_id } = body;

    if (!period_id) {
      return NextResponse.json(
        { success: false, error: "Missing period_id" },
        { status: 400 }
      );
    }

    const student_files = await prisma.student.findMany({
      where: {
        Files: {
          some: {
            period_id: period_id,
          },
        },
      },
      select: {
        student_id: true,
        nim: true,
        User: {
          select: {
            user_id: true,
            name: true,
          },
        },
        Files: {
          where: {
            period_id: period_id,
          },
          select: {
            file_id: true,
            file_url: true,
            file_name: true,
            type: true,
          },
        },
        Statuses: {
          where: {
            period_id: period_id,
          },
          select: {
            passDitmawa: true,
            passIOM: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: student_files });
  } catch (error) {
    console.error("Error fetching students and files:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
