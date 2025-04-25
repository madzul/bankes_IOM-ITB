// app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = (await context.params).id;
  const userId = parseInt(params, 10);

  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = (await context.params).id;
  const userId = parseInt(params, 10);

  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    await prisma.user.delete({
      where: { user_id: userId },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error deleting user" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = (await context.params).id;
  const userId = parseInt(params, 10);

  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
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