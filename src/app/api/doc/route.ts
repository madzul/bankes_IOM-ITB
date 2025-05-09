import { NextResponse } from 'next/server';
import { createSwaggerSpec } from 'next-swagger-doc';

// Create the Swagger specification
const spec = createSwaggerSpec({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dokumentasi API Website bantuan mahasiswa IOM',
      version: '1.0.0',
    },
  },
  apiFolder: 'src/app/api',
});

// Export a GET handler for the App Router
export async function GET() {
  return NextResponse.json(spec);
}