import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const allowedRoles = ["Pengurus_IOM", "Pewawancara"]
    if (!session?.user?.id || !allowedRoles.includes(session?.user?.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { period_id, user_id } = await request.json()

    if (!user_id || !period_id) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const slotid = await prisma.interviewSlot.findFirst({
      where: {
        period_id: period_id,
        student_id: user_id,
      },
      select: {
        id: true,
      }
    })
    
    if (!slotid) {
      return NextResponse.json(
        { success: false, error: "Slot ID Not found" },
        { status: 400 }
      );
    }

    const form = await prisma.notes.findFirst({
      where: {
        slot_id: slotid.id,
        user_id: user_id
      },
      select: {
        text: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: form,
    })
  } catch (error) {
    console.error("Error saving form data:", error)
    return NextResponse.json({ success: false, error: "Failed to save form data" }, { status: 500 })
  }
}