import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

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

    if (!period_id || isNaN(Number(period_id))) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing period_id" },
        { status: 400 }
      );
    }

    const studentData = await prisma.status.findMany({
      where: {
        period_id: Number(period_id),
      },
      select: {
        student_id: true,
        period_id: true,
        passDitmawa: true,
        passIOM: true,
        Student: {
          select: {
            nim: true,
            User: {
              select: {
                user_id: true,
                name: true,
              },
            },
            Files: {
              select: {
                file_id: true,
                student_id: true,
                file_url: true,
                file_name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: studentData });
  } catch (error) {
    console.error("Error fetching students and files:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
