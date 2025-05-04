// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';

const prisma = new PrismaClient();

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
    
  if (!session?.user || session.user.role !== "Admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const params = (await context.params).id;
  const userId = parseInt(params, 10);

  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
  }

  try {
    await prisma.user.delete({
      where: { user_id: userId },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Error deleting user" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
    
  if (!session?.user || session.user.role !== "Admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const params = (await context.params).id;
  const userId = parseInt(params, 10);

  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { user_id: userId },
      data: { role: "Pengurus_IOM" },
    });
    return NextResponse.json({ message: "User role updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error updating user role" },
      { status: 500 }
    );
  }
}