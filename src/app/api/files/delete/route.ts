import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';

// Configure MinIO client
// CHANGE HERE: Update with your MinIO server credentials
const minioClient = new Client({
    endPoint: "localhost",
    port: 9000,
    useSSL: false,
    accessKey: "minioadmin",
    secretKey: "minioadmin",
  });

// Handling file deletion
// File: app/api/delete-from-minio/route.ts
export async function DELETE(request: NextRequest) {
    try {
      const searchParams = request.nextUrl.searchParams;
      const bucketName = searchParams.get('bucket') || 'documents-bucket';
      const fileName = searchParams.get('fileUrl');
      
      console.log(fileName);

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