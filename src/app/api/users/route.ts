import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';

const prisma = new PrismaClient();

// For profile page
export async function GET() {

	const session = await getServerSession(authOptions);
	
	if (!session?.user?.id) {
		return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
	}

	const userId = parseInt(session.user.id, 10);
	if (isNaN(userId)) {
		return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
	}

	try {
		const user = await prisma.user.findUnique({
			where: { user_id: userId},
		});

		if (!user) {
			return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
		}

		return NextResponse.json(user);
	} catch (error) {
		console.error("Error fetching user:", error);
		return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}