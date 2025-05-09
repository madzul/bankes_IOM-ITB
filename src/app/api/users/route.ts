import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';

const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints related to user data
 *
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get the authenticated user's profile
 *     description: Retrieve the profile of the currently authenticated user
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Jane Doe"
 *                 email:
 *                   type: string
 *                   example: "jane@example.com"
 *                 role:
 *                   type: string
 *                   enum: [Admin, Pengurus_IOM, Mahasiswa]
 *       401:
 *         description: Unauthorized - no valid session found
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
 *                   example: "Unauthorized"
 *       400:
 *         description: Invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                   example: "Invalid user ID"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error"
 */
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