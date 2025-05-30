import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  context: { params: { studentId: string; periodId: string } }
) {
  try {
    const { studentId, periodId } = await context.params;
    
    const studentIdNum = parseInt(studentId, 10);
    const periodIdNum = parseInt(periodId, 10);
    
    if (isNaN(studentIdNum) || isNaN(periodIdNum)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID or period ID" },
        { status: 400 }
      );
    }
    
    const status = await prisma.status.findUnique({
      where: {
        student_id_period_id: {
          student_id: studentIdNum,
          period_id: periodIdNum,
        },
      },
    });
    
    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}