import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const studentId = Number(session.user.id);
    const { fileType } = await request.json(); // Get file type from the request body

    if (!fileType) {
      return NextResponse.json({ error: "Missing file type" }, { status: 400 });
    }

    // Retrieve file info from database
    const fileRecord = await prisma.file.findFirst({
      where: { student_id: studentId, type: fileType }
    });

    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const bucketName = process.env.MINIO_BUCKET_NAME || "iom-itb";

    await minioClient.removeObject(bucketName, fileRecord.file_name);

    const currentPeriod = await prisma.period.findFirst({
      where: {
        is_current: true,
      }
    })

    if (!currentPeriod) {
      throw new Error("No current period found in the database.");
    }    

    await prisma.file.delete({
      where: { 
        file_id: fileRecord.file_id,
        period_id: currentPeriod?.period_id,
      }
    });

    return NextResponse.json({ success: true, message: "File deleted successfully" });
    
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Deletion failed' },
      { status: 500 }
    );
  }
}
