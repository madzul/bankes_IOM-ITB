import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

const prisma = new PrismaClient();

// Ambil report untuk periode tertentu (berita acara)
export async function GET(
  request: Request,
  context: { params: { periodId: string } }
) {
  try {
	const session = await getServerSession(authOptions);
	if (!session?.user || session.user.role !== "Pengurus_IOM"){
	  return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
	}
	const { periodId } = await context.params;
	const periodIdNum = parseInt(periodId, 10);
	
	if (isNaN(periodIdNum)) {
	  return NextResponse.json(
		{ success: false, error: "Invalid period" }, // (Invalid period ID)
		{ status: 400 }
	  );
	}
	
	const report = await prisma.status.findMany({
		where: {
			period_id: periodIdNum, // Untuk periode tertentu
			amount: {
				not: 0, // Yang keterima saja, 0 berarti tidak dibiayai
			},
		},
		select: {
			amount: true,
			Student: {
				select: {
					nim: true,
					student_id: true,
					faculty: true,
					major: true,
					User: {
						select: {
							name: true,
						},
					},
				},
			},
		},
	});
	
	if (!report) {
	  return NextResponse.json(
		{ success: false, error: "Report not found" },
		{ status: 404 }
	  );
	}
	
	return NextResponse.json(report);
  } catch (error) {
	console.error("Error fetching report:", error);
	return NextResponse.json(
	  { success: false, error: "Failed to fetch data" },
	  { status: 500 }
	);
  }
}