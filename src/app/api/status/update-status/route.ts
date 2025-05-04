import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/services/sendNotification";
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

        // Send push notification if status is updated
        // Asumsi dalam notification body: jika sudah "Finalisasi", sudah disiapkan jadwal untuk wawancara
        if (updatedStatus) {
          const notificationTitle = updatedStatus.passIOM ? "Selamat, kamu lanjut untuk tahap berikutnya" : "Mohon maaf, anda belum berhak untuk lanjut ke tahap berikutnya";
          const notificationBody = `Telah diupdate status beasiswa kamu untuk periode sekarang. ${
            updatedStatus.passDitmawa 
              ? (updatedStatus.passIOM 
                  ? "Silahkan pilih jadwal wawancara yang sesuai waktu Anda." 
                  : "Silahkan coba lagi di periode berikutnya.") 
              : "Terdapat kemungkinan kamu sudah punya beasiswa lain."
          }`;
            const url = "/student/scholarship";
            await sendPushNotification(student_id, notificationTitle, notificationBody, url);
        }

        return updatedStatus;
      })
    );
    
    return NextResponse.json({ success: true, data: updatedStudents });
  } catch (error) {
    console.error("Error updating student statuses:", error);
    return NextResponse.json({ success: false, error: "Failed to update student statuses" }, { status: 500 });
  }
}