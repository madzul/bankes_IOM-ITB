'use client'

import { useState, ChangeEvent } from 'react';
import axios from 'axios'; // You'll need to install axios for HTTP requests

// Define types for our component and MinIO response
interface DocumentUploadProps {
  // You can add props here if needed in the future
}

interface UploadResponse {
  success: boolean;
  fileUrl?: string;
  error?: string;
}

export default function DocumentUpload({}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedDocs, setUploadedDocs] = useState<Map<string, string>>(new Map());
  
  // Typed event handlers
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Check if files exist and get the first one
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };
  
  const handleDocTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedDocType(event.target.value);
  };
  
  // This is the function you need to modify for MinIO upload
  const handleUpload = async (): Promise<void> => {
    if (!selectedFile || !selectedDocType) {
      alert('Please select both a document type and a file');
      return;
    }

    setIsUploading(true);
    
    try {
      // Step 1: Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('documentType', selectedDocType);
      
      // Step 2: Configure MinIO upload endpoint
      // CHANGE HERE: Update with your MinIO server details
      const minioConfig = {
        endPoint: 'your-minio-server.example.com', // Replace with your MinIO server endpoint
        port: 9000,                                // Default MinIO port
        bucketName: 'documents-bucket',            // Replace with your bucket name
        useSSL: true                               // Set to false if not using HTTPS
      };
      
      // Step 3: Send the upload request to your API that handles MinIO upload
      // CHANGE HERE: Update with your actual API endpoint that handles MinIO upload
      const response = await axios.post<UploadResponse>('/api/upload-to-minio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // You might need additional headers for authentication
        },
        params: {
          bucket: minioConfig.bucketName,
          documentType: selectedDocType,
        }
      });
      
      // Step 4: Handle the response
      if (response.data.success && response.data.fileUrl) {
        console.log('File uploaded successfully:', response.data.fileUrl);
        
        // Update the uploaded documents map
        setUploadedDocs(prev => {
          const newMap = new Map(prev);
          newMap.set(selectedDocType, response.data.fileUrl || '');
          return newMap;
        });
        
        // Reset form fields after successful upload
        setSelectedFile(null);
        setSelectedDocType('');
        
        // If you have a file input ref, you might want to reset it
        const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Check if a document has been uploaded
  const isDocumentUploaded = (docType: string): boolean => {
    return uploadedDocs.has(docType);
  };
  
  // Handle document removal
  const handleRemoveDocument = async (docType: string): Promise<void> => {
    if (!isDocumentUploaded(docType)) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to remove ${docType}?`);
    if (!confirmDelete) return;
    
    try {
      // CHANGE HERE: Add your API call to delete the file from MinIO
      const fileUrl = uploadedDocs.get(docType);
      await axios.delete('/api/delete-from-minio', {
        params: {
          fileUrl,
          documentType: docType,
          // You might need to include bucket information here
        }
      });
      
      // Update state to remove the document
      setUploadedDocs(prev => {
        const newMap = new Map(prev);
        newMap.delete(docType);
        return newMap;
      });
      
      console.log(`${docType} removed successfully`);
    } catch (error) {
      console.error('Error removing document:', error);
      alert(`Failed to remove document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // List of required documents
  const documents: string[] = [
    'Kartu Keluarga',
    'Surat Keterangan Penghasilan orang tua/wali',
    'SPT Pribadi Pajak Penghasilan terakhir',
    'Foto Tempat Tinggal',
    'Tagihan/Pembayaran Listrik',
    'Surat Keterangan Pensiun',
    'Surat pernyataan orang tua/wali',
    'Kartu Indonesia Pintar Kuliah (KIP-K)',
    'Dokumen Pendukung 1',
    'Dokumen Pendukung 2'
  ];

  return (
    <div className="font-sans max-w-4xl mx-auto my-5">
      <div className="bg-[#2074b9] text-white p-4 text-lg font-bold rounded-t-md">
        Upload Dokumen Pendukung
      </div>
      
      <div className="bg-yellow-100 p-4 mb-5 border border-yellow-100">
        <p className="m-0">
          Surat Keterangan Penghasilan dapat ditandatangani oleh pemberi kerja (atasan, kantor/HRD, atau majikan), atau pihak lain yang bisa memberikan keterangan penghasilan orang tua/wali (Ketua RT/RW).
        </p>
      </div>
      
      {/* Upload Section - Positioned above the document list */}
      <div className="flex justify-between items-start my-5 p-4 bg-gray-100 border border-gray-300 rounded-md">
        <div className="w-2/3 pr-4">
          <div className="font-bold mb-2">Jenis Dokumen</div>
          <select 
            className="w-full p-2 border border-gray-300 rounded-md"
            value={selectedDocType}
            onChange={handleDocTypeChange}
          >
            <option value="">Pilih jenis dokumen</option>
            {documents.map((doc, index) => (
              <option key={index} value={doc}>{doc}</option>
            ))}
          </select>
        </div>
        
        <div className="w-1/3">
          <div className="font-bold mb-2">File Dokumen</div>
          <div className="relative mb-3">
            <input
              type="file"
              id="fileUpload"
              onChange={handleFileChange}
              className="opacity-0 absolute inset-0 w-full cursor-pointer z-10"
            />
            <label
              htmlFor="fileUpload"
              className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md border border-gray-300 cursor-pointer w-full"
            >
              {selectedFile ? selectedFile.name : "Choose File"}
            </label>
          </div>
          
          <button 
            onClick={handleUpload}
            disabled={isUploading || !selectedFile || !selectedDocType}
            className={`${
              isUploading || !selectedFile || !selectedDocType
                ? 'bg-gray-400'
                : 'bg-[#2074b9] hover:bg-[#1a5d94]'
            } text-white border-none py-2 px-4 rounded-md cursor-pointer font-bold float-right`}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
      
      {/* Document List Section */}
      <div className="flex border-b border-gray-300 pb-2 mb-2 font-bold">
        <div className="flex-3 p-1">Dokumen</div>
        <div className="flex-1 p-1 text-center">Status</div>
      </div>
      
      {documents.map((doc, index) => (
        <div key={index} className="flex border-b border-gray-300 py-2">
          <div className="flex-grow p-1">{doc}</div>
          <div className="w-24 p-1 text-center">
            {isDocumentUploaded(doc) ? (
              <button 
                onClick={() => handleRemoveDocument(doc)}
                className="bg-red-600 hover:bg-red-700 text-white border-none py-1 px-2 rounded-md cursor-pointer"
              >
                ✕
              </button>
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}