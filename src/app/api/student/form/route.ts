import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

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
    const whereClause =
      session.user.role === "Pewawancara"
        ? {
            slot: {
              period_id: pid,
              user_id: user_id,
              student_id: {
                not: null,
              },
            },
            user_id: {
              equals: prisma.interviewSlot.fields.student_id,
            },
          }
        : {
            slot: {
              period_id: pid,
            },
          };

    const notes = await prisma.notes.findMany({
      where: session.user.role === "Pewawancara"
        ? {
            slot: {
              period_id: pid,
              user_id: user_id,
            },
          }
        : {
            slot: {
              period_id: pid,
            },
          },
      select: {
        user_id: true,
        text: true,
        student: {
          select: {
            nim: true,
            User: {
              select: {
                user_id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
