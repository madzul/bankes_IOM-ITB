import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();


// GET /api/iom-staff - Get all IOM staff for the participant dropdown
export async function GET() {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user?.id || session.user.role !== "Pengurus_IOM") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
  
      const iomStaff = await prisma.user.findMany({
        where: { role: "Pengurus_IOM" },
        select: {
          user_id: true,
          name: true,
          email: true,
        },
      });
  
      return NextResponse.json({ success: true, data: iomStaff });
    } catch (error) {
      console.error("Error fetching IOM staff:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch IOM staff" },
        { status: 500 }
      );
    }
  }
