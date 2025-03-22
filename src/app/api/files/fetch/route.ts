import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== "IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const student_files = await prisma.student.findMany({
      select: {
        id: true,
        nim: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        files: {
          select: {
            id: true,
            file_url: true,
            file_name: true,
            type: true,
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
