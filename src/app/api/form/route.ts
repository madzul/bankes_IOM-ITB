import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { period_id } = body;

    if (!period_id || isNaN(Number(period_id))) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing period_id" },
        { status: 400 }
      );
    }

    const notes = await prisma.notes.findMany({
      where: {
        interview: {
            period_id: Number(period_id),
        },
      },
      select: {
        text: true,
        student: {
          select: {
            nim: true,
          },
        },
        interview: {
          select: {
            User: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const formatted = notes.map(note => ({
      text: note.text,
      nim: note.student.nim,
      userName: note.interview.User.name
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching form interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}