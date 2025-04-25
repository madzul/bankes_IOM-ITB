import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

interface StudentUpdate {
  student_id: number;
  period_id: number;
  Statuses: {
    passDitmawa: boolean;
    passIOM: boolean;
  }[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentsToUpdate = body as StudentUpdate[];

    const updatedStudents = await Promise.all(
      studentsToUpdate.map(async (student) => {
        const { student_id, period_id, Statuses } = student;

        const existingStudent = await prisma.student.findUnique({
          where: { student_id },
        });

        if (!existingStudent) {
          return { success: false, error: `Student with ID ${student_id} not found` };
        }

        const updatedStatus = await prisma.status.update({
          where: { student_id_period_id: { student_id, period_id } },
          data: {
            passDitmawa: Statuses[0].passDitmawa,
            passIOM: Statuses[0].passIOM,
          },
        });

        return updatedStatus;
      })
    );

    return NextResponse.json({ success: true, data: updatedStudents });
  } catch (error) {
    console.error("Error updating student statuses:", error);
    return NextResponse.json({ success: false, error: "Failed to update student statuses" }, { status: 500 });
  }
}