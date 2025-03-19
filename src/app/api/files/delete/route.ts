import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';

config();

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

export async function DELETE(request: NextRequest) {
    try {
      const searchParams = request.nextUrl.searchParams;
      const bucketName = searchParams.get('bucket') || 'documents-bucket';
      const fileName = searchParams.get('fileUrl');
      
      if (!fileName) {
        return NextResponse.json({ success: false, error: 'No file name provided' }, { status: 400 });
      }
      
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