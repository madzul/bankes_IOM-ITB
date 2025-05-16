import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/services/sendNotification";
import { FileType } from "@prisma/client";

const prisma = new PrismaClient();

interface StudentUpdate {
  student_id: number;
  period_id: number;
  Statuses: {
    passDitmawa: boolean;
    passIOM: boolean;
    amount?: number; // Add this field
  }[];
}


/**
* @swagger 
* components:
*   schemas:
*     Period:
*       type: object
*       properties:
*         period_id:
*           type: integer
*           format: int64
*           description: Unique period identifier
*           example: 2023
*         period:
*           type: string
*           description: Academic period name/identifier
*           example: "2023/2024"
*         start_date:
*           type: string
*           format: date-time
*           description: Period start datetime
*           example: "2023-07-01T00:00:00Z"
*         end_date:
*           type: string
*           format: date-time
*           description: Period end datetime
*           example: "2024-06-30T23:59:59Z"
*         is_current:
*           type: boolean
*           description: Marks if this is the current active period
*           default: false
*         is_open:
*           type: boolean
*           description: Indicates if registrations are open
*           default: false
*       required:
*         - period_id
*         - period
*         - start_date
*         - end_date
*         - is_current
*         - is_open 
*/

/**
 * @swagger
 * /api/status/update-status:
 *   post:
 *     tags:
 *       - Registration Status
 *     summary: Update student status
 *     description: Update evaluation status for a student in a specific period (Admin only)
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - period_id
 *               - passDitmawa
 *               - passIOM
 *             properties:
 *               student_id:
 *                 type: integer
 *                 example: 12345
 *               period_id:
 *                 type: integer
 *                 example: 2023
 *               passDitmawa:
 *                 type: boolean
 *                 example: true
 *               passIOM:
 *                 type: boolean
 *                 example: false
 *               amount:
 *                 type: integer
 *                 nullable: true
 *                 example: 1500000
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Status'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid student ID or period ID"
 *       401:
 *         description: Unauthorized access
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Status record not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Status record not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 * 
 * components:
 *   schemas:
 *     Status:
 *       type: object
 *       properties:
 *         student_id:
 *           type: integer
 *         period_id:
 *           type: integer
 *         passDitmawa:
 *           type: boolean
 *         passIOM:
 *           type: boolean
 *         passInterview:
 *           type: boolean
 *         amount:
 *           type: integer
 *           nullable: true
 *         Student:
 *           $ref: '#/components/schemas/Student'
 *         Period:
 *           $ref: '#/components/schemas/Period'
 */

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

        const fileTypes = Object.values(FileType).map((key) => ({
          title: key.replace(/_/g, " "),
          key,
        }));

        const uploadedFiles = await prisma.file.findMany({
          where: { student_id },
        });

        const uploadedFileTypes = new Set(uploadedFiles.map((file) => file.type));
        const requiredFileTypes = new Set(Object.values(FileType));

        const allFilesUploaded = [...requiredFileTypes].every((type) =>
          uploadedFileTypes.has(type as FileType)
        );

        if (!allFilesUploaded) {
          return NextResponse.json({
            success: false,
            error: `Cannot update passIOM: All required files are not uploaded for student ID ${student_id}`,
          });
        }

        const updatedStatus = await prisma.status.update({
          where: { student_id_period_id: { student_id, period_id } },
          data: {
            passDitmawa: Statuses[0].passDitmawa,
            passIOM: Statuses[0].passIOM,
            amount: Statuses[0].amount !== undefined ? Statuses[0].amount : null, // Set amount from the request
          },
        });

        // Send push notification if status is updated
        // Asumsi dalam notification body: jika sudah "Finalisasi", sudah disiapkan jadwal untuk wawancara
        if (updatedStatus) {
          const notificationTitle = updatedStatus.passIOM ? "Selamat, kamu lanjut untuk tahap berikutnya" : "Mohon maaf, anda belum berhak untuk lanjut ke tahap berikutnya";
          const amountInfo = updatedStatus.amount ? `Anda akan menerima bantuan sebesar Rp${updatedStatus.amount}.` : "";
          const notificationBody = `Telah diupdate status beasiswa kamu untuk periode sekarang. ${
            updatedStatus.passDitmawa 
              ? (updatedStatus.passIOM 
                  ? `Silahkan pilih jadwal wawancara yang sesuai waktu Anda. ${amountInfo}` 
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