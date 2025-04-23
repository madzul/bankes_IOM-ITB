import { NextRequest, NextResponse } from "next/server";
import { Client } from "minio";
import { FileType, PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import { join } from "path";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "",
  secretKey: process.env.MINIO_SECRET_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const studentId = Number(session.user.id);
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const documentTypes = formData.getAll("documentTypes") as string[];

    if (!files.length) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 });
    }

    const bucketName = request.nextUrl.searchParams.get("bucket") || "documents-bucket";
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, "us-east-1");
    }

    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const documentType = documentTypes[i] || "unknown";
      const fileExtension = file.name.split('.').pop();
      const newFileName = `${uuidv4()}-${studentId}-${documentType}.${fileExtension}`;

      const fileArrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(fileArrayBuffer);

      const tempFilePath = join("/", newFileName);
      await writeFile(tempFilePath, fileBuffer);

      await minioClient.fPutObject(bucketName, newFileName, tempFilePath, {
        'Content-Type': file.type,
        'X-Document-Type': documentType,
      });

      // TODO: make it secure
      const fileUrl = `http://${process.env.MINIO_ENDPOINT}:${9000}/${bucketName}/${newFileName}`;

      const existingFile = await prisma.file.findFirst({
        where: {
          student_id: studentId,
          type: documentType as FileType,
        },
      });

      if (existingFile) {
        const existingFileName = existingFile.file_name;

        try {
          await minioClient.removeObject(bucketName, existingFileName);
          console.log(`Removed existing file from MinIO: ${existingFileName}`);
        } catch (error) {
          console.error("Error removing file from MinIO:", error);
          throw new Error("Failed to remove existing file from MinIO");
        }
    
        await prisma.file.update({
          where: { file_id: existingFile.file_id },
          data: {
            file_url: fileUrl,
            file_name: newFileName,
          },
        });
      } else {
        await prisma.file.create({
          data: {
            file_url: fileUrl,
            file_name: newFileName,
            type: documentType as FileType,
            student_id: studentId,
          },
        });
      }

      uploadedFiles.push({
        fileName: newFileName,
        fileUrl,
        documentType,
      });
    }

    return NextResponse.json({ success: true, files: uploadedFiles });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
