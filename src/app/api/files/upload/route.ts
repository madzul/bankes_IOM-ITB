import { NextRequest, NextResponse } from "next/server";
import { Client } from "minio";
import { FileType, PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import { join } from "path";
import { writeFile } from "fs/promises";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     tags:
 *       - Files
 *     summary: Upload one or more files for a student
 *     description: Authenticated students can upload files. Existing files of the same type will be replaced.
 *     security:
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: One or more files to upload
 *               documentTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Corresponding document types for each file (e.g., CV, TRANSKRIP)
 *     parameters:
 *       - in: query
 *         name: bucket
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional bucket name to upload to (defaults to `documents-bucket`)
 *     responses:
 *       '200':
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fileName:
 *                         type: string
 *                       fileUrl:
 *                         type: string
 *                       documentType:
 *                         type: string
 *       '400':
 *         description: No files provided or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized (session missing or invalid)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Upload failed due to server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

      const validMimeTypes = ["image/png", "image/jpeg", "application/pdf"];
      if (!validMimeTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `Invalid file type for ${file.name}. Only PNG, JPG, and PDF are allowed.` },
          { status: 400 }
        );
      }
      
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
