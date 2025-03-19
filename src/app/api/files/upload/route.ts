import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';
import { PrismaClient } from "@prisma/client";
// import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs/promises';
import { join } from 'path';
// import { tmpdir } from 'os';

const prisma = new PrismaClient();

const endPoint: string = process.env.MINIO_ENDPOINT;
const port: number = parseInt(process.env.MINIO_PORT, 10);
const useSSL: boolean = process.env.MINIO_USE_SSL === "true";
const accessKey: string = process.env.MINIO_ACCESS_KEY;
const secretKey: string= process.env.MINIO_SECRET_KEY;

const minioClient = new Client({
  endPoint: endPoint,
  port: port,
  useSSL: useSSL,
  accessKey: accessKey,
  secretKey: secretKey
});

export async function POST(request: NextRequest) {
  try {
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
    
    const tempFilePath = join("/", fileName);
    await writeFile(tempFilePath, fileBuffer);
    
    await minioClient.fPutObject(bucketName, fileName, tempFilePath, {
      'Content-Type': file.type,
      'X-Document-Type': documentType,
    });
    
    const fileUrl = `https://${endPoint}:${port}/${bucketName}/${fileName}`;
    
    const newFile = await prisma.file.create({
      data: {
        file_url: fileUrl,
        file_name: fileName,
        type: documentType,
        StudentId: 1, // TODO
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

