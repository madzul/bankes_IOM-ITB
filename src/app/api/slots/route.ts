import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

// GET /api/slots - Get all slots
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = session.user.role;

    // Different views based on role
    if (userRole === "Pengurus_IOM") {
      // IOM staff can see all slots
      const slots = await prisma.interviewSlot.findMany({
        include: {
          User: {
            select: {
              name: true,
              email: true,
            },
          },
          Participants: {
            include: {
              User: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          Student: {
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
      return NextResponse.json({ success: true, data: slots });
    } else if (userRole === "Mahasiswa") {
      // Students only see available slots and their own bookings
      const currentPeriod = await prisma.period.findFirst({
        where: { is_current: true },
      });

      if (!currentPeriod) {
        return NextResponse.json(
          { success: false, error: "No active period found" },
          { status: 404 }
        );
      }

      // Get all slots in the current period
      const slots = await prisma.interviewSlot.findMany({
        where: {
          period_id: currentPeriod.period_id,
        },
        include: {
          User: {
            select: {
              name: true,
            },
          },
          Participants: {
            include: {
              User: {
                select: {
                  name: true,
                },
              },
            },
          },
          Student: {
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

      return NextResponse.json({ success: true, data: slots });
    } else {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch slots" },
      { status: 500 }
    );
  }
}

// POST /api/slots - Create new slot
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      start_time,
      end_time,
    } = body;

    // Validation
    if (!start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the current period
    const currentPeriod = await prisma.period.findFirst({
      where: { is_current: true },
    });

    if (!currentPeriod) {
      return NextResponse.json(
        { success: false, error: "No active period found" },
        { status: 404 }
      );
    }

    // Create a new slot
    const slot = await prisma.interviewSlot.create({
      data: {
        title,
        description,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        user_id: Number(session.user.id),
        period_id: currentPeriod.period_id,
      },
    });

    return NextResponse.json({
      success: true,
      data: slot,
    });
  } catch (error) {
    console.error("Error creating slot:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create slot" },
      { status: 500 }
    );
  }
}