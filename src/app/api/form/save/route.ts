import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();
/**
 * @swagger
 * /api/form/save:
 *   post:
 *     summary: Save or update interview form notes for a specific student and period
 *     tags:
 *       - Forms
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               period_id:
 *                 type: integer
 *                 description: ID of the academic period
 *                 example: 1
 *               nim:
 *                 type: string
 *                 description: Student NIM (identifier)
 *                 example: "13522119"
 *               formData:
 *                 type: object
 *                 description: Key-value pairs of interview notes fields
 *                 example:
 *                   value: "value1"
 *             required:
 *               - period_id
 *               - nim
 *               - formData
 *     responses:
 *       200:
 *         description: Successfully saved form notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     slot_id:
 *                       type: integer
 *                       description: Interview slot ID
 *                       example: 1
 *                     student_id:
 *                       type: integer
 *                       description: Student user ID
 *                       example: 101
 *                     text:
 *                       type: string
 *                       description: JSON-encoded interview notes
 *                       example: "{\"value\":\"value1\"}"
 *       400:
 *         description: Invalid or missing fields, or related record not found
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
 *                   description: One of the possible error messages
 *                   enum:
 *                     - Missing required fields
 *                     - ID Not found
 *                     - Slot ID Not found
 *                   example: Missing required fields
 *       403:
 *         description: Forbidden (insufficient permissions)
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
 *                   example: Unauthorized
 *       500:
 *         description: Server error saving data
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
 *                   example: Failed to save form data
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { period_id, nim, formData } = await request.json()

    if (!nim || !formData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("periods : ", period_id);
    console.log("nim : ",nim);
    console.log("formData : ",formData);

    const id = await prisma.student.findFirst({
      where: {
        nim: nim,
      },
      select: {
        User: true
      }
    })
    console.log("id : ",id);

    if (!id?.User.user_id) {
      return NextResponse.json(
        { success: false, error: "ID Not found" },
        { status: 400 }
      );
    }

    const slotid = await prisma.interviewSlot.findFirst({
      where: {
        period_id: period_id,
        student_id: id?.User.user_id,
      },
      select: {
        id: true,
      }
    })
    console.log("slotid : ",slotid);
    
    if (!slotid) {
      return NextResponse.json(
        { success: false, error: "Slot ID Not found" },
        { status: 400 }
      );
    }

    console.log("Form data : ", formData)

    const notes = await prisma.notes.update({
      where: {
        slot_id_student_id: {
          slot_id: slotid.id,
          student_id: id.User.user_id,
        },
      },
      data: {
        text: JSON.stringify(formData)
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