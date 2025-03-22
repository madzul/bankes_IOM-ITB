import { PrismaClient } from "@prisma/client"; 
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const students = await prisma.student.findMany({
            select: {
                id: true,
                user: {
                    select: {
                        name: true,
                    },
                },
                nim: true,
            },
        });

        const formattedStudents = students.map((student) => ({
            id: student.id,
            nim: student.nim,
            name: student.user.length > 0 ? student.user[0].name : "Unknown",
        }));

        return NextResponse.json(formattedStudents, { status: 200 });
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
