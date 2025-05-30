import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

// Fetch student by period and passed for interview
// api for penilaian "fetchStudentByPeriod()"
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const allowedRoles = ["Pengurus_IOM"];

  if (!session?.user?.id || !allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const period_id = parseInt(searchParams.get("period_id") || "", 10);
  
  const pid = Number(period_id);
  if (!pid || isNaN(pid)) {
    return NextResponse.json(
      { success: false, error: "Invalid or missing period_id" },
      { status: 400 }
    );
  }

  try {
    
    const studentData = await prisma.status.findMany({
      where: {
        period_id: pid,
        passIOM: true,
      },
      select: {
        student_id: true,
        period_id: true,
        Student: {
          select: {
            nim: true,
            User: {
              select: {
                user_id: true,
                name: true,
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
