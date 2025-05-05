'use client'; 

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Disable SSR for SwaggerUI component
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return <SwaggerUI url="api/doc" />;
}