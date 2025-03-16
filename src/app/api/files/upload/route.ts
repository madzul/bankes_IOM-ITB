import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';
// import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs/promises';
import { join } from 'path';
// import { tmpdir } from 'os';

// Configure MinIO client
const endPoint = "localhost";
const port= 9000;
const useSSL= false;
const accessKey= "minioadmin";
const secretKey= "minioadmin";

const minioClient = new Client({
  endPoint: endPoint,
  port: port,
  useSSL: useSSL,
  accessKey: accessKey,
  secretKey: secretKey
});

export async function POST(request: NextRequest) {
  try {
    // Get the bucket name from the query params
    const searchParams = request.nextUrl.searchParams;
    const bucketName = searchParams.get('bucket') || 'documents-bucket'; // Default bucket name
    const documentType = searchParams.get('documentType') || '';
    
    // Ensure the bucket exists
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      // Optionally create the bucket if it doesn't exist
      await minioClient.makeBucket(bucketName, 'us-east-1'); // Region can be changed as needed
    }
    
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    
    // Generate a unique file name to prevent overwriting
    // const fileExtension = file.name.split('.').pop();
    // const fileName = `${documentType.replace(/\s+/g, '-').toLowerCase()}-${uuidv4()}.${fileExtension}`;
    // Testing
    const fileName = file.name;
    
    // Convert the file to Buffer for MinIO upload
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    
    // For MinIO to read the file, we need to save it temporarily
    const tempFilePath = join("/", fileName);
    await writeFile(tempFilePath, fileBuffer);
    
    // Upload the file to MinIO
    await minioClient.fPutObject(bucketName, fileName, tempFilePath, {
      'Content-Type': file.type,
      'X-Document-Type': documentType,
    });
    
    // Generate URL for the uploaded file
    const fileUrl = `https://${endPoint}:${port}/${bucketName}/${fileName}`;
    
    // You might need to generate a presigned URL for secure access
    // const presignedUrl = await minioClient.presignedGetObject(bucketName, fileName, 24 * 60 * 60); // 24 hours expiry
    
    return NextResponse.json({
      success: true,
      fileUrl: fileUrl,
      // presignedUrl: presignedUrl,
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

