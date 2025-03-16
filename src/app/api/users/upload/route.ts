// File: app/api/upload-to-minio/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Configure MinIO client
// CHANGE HERE: Update with your MinIO server credentials
const minioClient = new Client({
  endPoint: 'your-minio-server.example.com', // Replace with your MinIO server endpoint
  port: 9000,                               // Default MinIO port
  useSSL: true,                             // Set to false if not using HTTPS
  accessKey: 'your-access-key',             // Replace with your MinIO access key
  secretKey: 'your-secret-key',             // Replace with your MinIO secret key
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
    const fileExtension = file.name.split('.').pop();
    const fileName = `${documentType.replace(/\s+/g, '-').toLowerCase()}-${uuidv4()}.${fileExtension}`;
    
    // Convert the file to Buffer for MinIO upload
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    
    // For MinIO to read the file, we need to save it temporarily
    const tempFilePath = join(tmpdir(), fileName);
    await writeFile(tempFilePath, fileBuffer);
    
    // Upload the file to MinIO
    await minioClient.fPutObject(bucketName, fileName, tempFilePath, {
      'Content-Type': file.type,
      'X-Document-Type': documentType,
    });
    
    // Generate URL for the uploaded file
    // CHANGE HERE: Adjust how you generate or retrieve the file URL
    const fileUrl = `https://${minioClient.endPoint}:${minioClient.port}/${bucketName}/${fileName}`;
    
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

// Handling file deletion
// File: app/api/delete-from-minio/route.ts
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bucketName = searchParams.get('bucket') || 'documents-bucket';
    const fileName = searchParams.get('fileName');
    
    if (!fileName) {
      return NextResponse.json({ success: false, error: 'No file name provided' }, { status: 400 });
    }
    
    // Remove the object from MinIO
    await minioClient.removeObject(bucketName, fileName);
    
    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting from MinIO:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Deletion failed' },
      { status: 500 }
    );
  }
}