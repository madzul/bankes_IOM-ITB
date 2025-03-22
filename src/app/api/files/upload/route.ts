import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';
import { PrismaClient } from "@prisma/client";
import { authOptions } from '../../auth/[...nextauth]/route';
// import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { FileType } from "@prisma/client";
import { getServerSession } from 'next-auth';
// import { tmpdir } from 'os';

const prisma = new PrismaClient();

const endPoint: string = process.env.MINIO_ENDPOINT || "localhost"; // Default fallback
const port: number = 9000; // Default MinIO port
const useSSL: boolean = process.env.MINIO_USE_SSL === "true";
const accessKey: string = process.env.MINIO_ACCESS_KEY || "";
const secretKey: string = process.env.MINIO_SECRET_KEY || "";

if (!accessKey || !secretKey) {
    throw new Error("Environment variables tidak ditemukan.");
}

const minioClient = new Client({
  endPoint: endPoint,
  port: port,
  useSSL: useSSL,
  accessKey: accessKey,
  secretKey: secretKey
});

export async function POST(request: NextRequest) {

  // TODO: Make it so that we upload all file first, 
  // then save to upload it

  try {

    const session = await getServerSession(authOptions);

    // if (!session || !session.user || !session.user.\) {
    //   return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    // }

    // console.log(session.user.email);

    // const user = await prisma.user.findUnique({
    //   where: { email: session.user.email },
    //   select: { student_id: true },
    // });
  
    // if (!user || !user.student_id) {
    //   return new Response(JSON.stringify({ error: "Student ID not found" }), { status: 404 });
    // }

    const searchParams = request.nextUrl.searchParams;
    const bucketName = searchParams.get('bucket') || 'documents-bucket';
    const documentType = searchParams.get('documentType') || '';
    
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
    }
  
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    
    // TODO: file name
    const fileName = file.name;
    
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    
    const tempFilePath = join("/Users/Kiza/", fileName);
    await writeFile(tempFilePath, fileBuffer);
    
    await minioClient.fPutObject(bucketName, fileName, tempFilePath, {
      'Content-Type': file.type,
      'X-Document-Type': documentType,
    });
    
    const fileUrl = `https://${endPoint}:${port}/${bucketName}/${fileName}`;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const newFile = await prisma.file.create({
      data: {
        file_url: fileUrl,
        file_name: fileName,
        type: documentType,
        student_id: session?.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      fileUrl: fileUrl,
      fileName: fileName,
      documentType: documentType
    });
    
  } catch (error) {
    console.error('Error uploading to MinIO:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

