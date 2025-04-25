import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { periods, nim, formData } = await request.json()

    if (!nim || !formData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(periods[0].period_id,);
    console.log(nim,);
    console.log(formData,);

    const notes = await prisma.notes.findFirst({
      where: {
        interview_id: periods[0].period_id,
        student_id: Number(nim),
      }
    })

    return NextResponse.json({
      success: true,
      data: notes,
    })
  } catch (error) {
    console.error("Error saving form data:", error)
    return NextResponse.json({ success: false, error: "Failed to save form data" }, { status: 500 })
  }
}