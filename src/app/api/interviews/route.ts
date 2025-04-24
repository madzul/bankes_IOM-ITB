import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET /api/interviews - Get all interviews
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
    const userId = Number(session.user.id);

    // Different views based on role
    if (userRole === "Pengurus_IOM") {
      // IOM staff can see all interviews
      const interviews = await prisma.interview.findMany({
        include: {
          User: {
            select: {
              name: true,
              email: true,
            },
          },
          participants: {
            include: {
              User: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          slots: {
            include: {
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
          },
        },
      });
      return NextResponse.json({ success: true, data: interviews });
    } else if (userRole === "Mahasiswa") {
      // Students only see available sessions and their own bookings
      const currentPeriod = await prisma.period.findFirst({
        where: { is_current: true },
      });

      if (!currentPeriod) {
        return NextResponse.json(
          { success: false, error: "No active period found" },
          { status: 404 }
        );
      }

      // Get all interview sessions in the current period
      const interviews = await prisma.interview.findMany({
        where: {
          period_id: currentPeriod.period_id,
        },
        include: {
          User: {
            select: {
              name: true,
            },
          },
          participants: {
            include: {
              User: {
                select: {
                  name: true,
                },
              },
            },
          },
          slots: {
            select: {
              id: true,
              slot_number: true,
              start_time: true,
              end_time: true,
              student_id: true,
              // Don't include student details for privacy
            },
          },
        },
      });

      return NextResponse.json({ success: true, data: interviews });
    } else {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch interviews" },
      { status: 500 }
    );
  }
}
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
      max_students,
    } = body;

    // Validation
    if (!start_time || !end_time || !max_students) {
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

    // Parse the main start and end times
    const baseStartDateTime = new Date(start_time);
    const baseEndDateTime = new Date(end_time);
    
    // Calculate the duration for each slot in milliseconds
    const slotDurationMs = baseEndDateTime.getTime() - baseStartDateTime.getTime();

    // Create the interview session with the initial time range
    const interview = await prisma.interview.create({
      data: {
        title,
        description,
        start_time: baseStartDateTime,
        // The end time of the interview is now the end of the last slot
        end_time: new Date(baseStartDateTime.getTime() + (slotDurationMs * max_students)),
        max_students,
        user_id: Number(session.user.id),
        period_id: currentPeriod.period_id,
      },
    });

    // Create the contiguous slots
    const slots = [];
    for (let i = 0; i < max_students; i++) {
      // Each slot starts right after the previous one
      const slotStartTime = new Date(baseStartDateTime.getTime() + (i * slotDurationMs));
      const slotEndTime = new Date(slotStartTime.getTime() + slotDurationMs);

      const slot = await prisma.interviewSlot.create({
        data: {
          interview_id: interview.interview_id,
          slot_number: i + 1,
          start_time: slotStartTime,
          end_time: slotEndTime,
        },
      });
      slots.push(slot);
    }

    return NextResponse.json({
      success: true,
      data: {
        interview,
        slots,
      },
    });
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create interview" },
      { status: 500 }
    );
  }
}