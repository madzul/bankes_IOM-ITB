import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // Guard route
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
    // const baseWhere = { slot: {
    //   select : {
    //     period_id : pid
    //   }
    // } };

    // const whereClause =
    //   session.user.role === "Pewawancara"
    //     ? {
    //         ...baseWhere,
    //           slot: {
    //             some: {
    //               period_id: pid,
    //               user_id: user_id,
    //               student_id: { not: null },
    //             },
    //           },
    //       }
    //     : baseWhere;

    const studentData = await prisma.notes.findMany({
      where: {
        slot: {
          period_id: pid,
        }
      },
      select: {
        user_id: true,
        text: true,
        student: {
          select: {
            nim: true,
            User: {
              select: {
                name: true,
              }
            }
          },
        }
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