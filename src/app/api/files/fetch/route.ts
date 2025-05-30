import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

/**
 * @swagger
 * paths:
 *   /api/files/fetch:
 *     post:
 *       tags:
 *         - Files
 *       summary: Fetch students and their files for a specific period
 *       security:
 *         - cookieAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - period_id
 *               properties:
 *                 period_id:
 *                   type: integer
 *                   description: ID of the period to fetch data for
 *       responses:
 *         '200':
 *           description: Successfully fetched students and files
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                   data:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         student_id:
 *                           type: integer
 *                         period_id:
 *                           type: integer
 *                         passDitmawa:
 *                           type: boolean
 *                         passIOM:
 *                           type: boolean
 *                         Student:
 *                           type: object
 *                           properties:
 *                             nim:
 *                               type: string
 *                             User:
 *                               type: object
 *                               properties:
 *                                 user_id:
 *                                   type: integer
 *                                 name:
 *                                   type: string
 *                             Files:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   file_id:
 *                                     type: integer
 *                                   student_id:
 *                                     type: integer
 *                                   file_url:
 *                                     type: string
 *                                   file_name:
 *                                     type: string
 *                                   type:
 *                                     type: string
 *       '400':
 *         description: Invalid or missing period_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Unauthorized access (not Pengurus_IOM)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Failed to fetch data due to server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */



// export async function POST(request: Request) {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
//       return NextResponse.json(
//         { success: false, error: "Unauthorized" },
//         { status: 403 }
//       );
//     }

//     const body = await request.json();
//     const { period_id } = body;

//     if (!period_id || isNaN(Number(period_id))) {
//       return NextResponse.json(
//         { success: false, error: "Invalid or missing period_id" },
//         { status: 400 }
//       );
//     }

//     const studentData = await prisma.status.findMany({
//       where: {
//         period_id: Number(period_id),
//       },
//       select: {
//         student_id: true,
//         period_id: true,
//         passDitmawa: true,
//         passIOM: true,
//         Student: {
//           select: {
//             nim: true,
//             User: {
//               select: {
//                 user_id: true,
//                 name: true,
//               },
//             },
//             Files: {
//               select: {
//                 file_id: true,
//                 student_id: true,
//                 file_url: true,
//                 file_name: true,
//                 type: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     return NextResponse.json({ success: true, data: studentData });
//   } catch (error) {
//     console.error("Error fetching students and files:", error);
//     return NextResponse.json(
//       { success: false, error: "Failed to fetch data" },
//       { status: 500 }
//     );
//   }
// }

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const allowedRoles = ["Pengurus_IOM", "Pewawancara"];

  if (!session?.user?.id || !allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  const user_id = parseInt(session.user.id);

  const { period_id } = await request.json();
  const pid = Number(period_id);
  if (!pid || isNaN(pid)) {
    return NextResponse.json(
      { success: false, error: "Invalid or missing period_id" },
      { status: 400 }
    );
  }

  try {
    const baseWhere = { period_id: pid };

    const whereClause =
      session.user.role === "Pewawancara"
        ? {
            ...baseWhere,
            Student: {
              InterviewSlots: {
                some: {
                  period_id: pid,
                  user_id: user_id,
                  student_id: { not: null },
                },
              },
            },
          }
        : baseWhere;

    const studentData = await prisma.status.findMany({
      where: whereClause,
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
