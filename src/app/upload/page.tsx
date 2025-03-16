'use client'

import { useState, ChangeEvent } from 'react';

// Define types for our component
interface DocumentUploadProps {
  // You can add props here if needed in the future
}

export default function DocumentUpload({}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  
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
  
  const handleUpload = (): void => {
    // Handle file upload logic here
    if (selectedFile && selectedDocType) {
      console.log('Uploading file:', selectedFile.name, 'as document type:', selectedDocType);
      // Implement actual upload functionality
    } else {
      alert('Please select both a document type and a file');
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
            className="bg-[#2074b9] text-white border-none py-2 px-4 rounded-md cursor-pointer font-bold float-right"
          >
            Upload
          </button>
        </div>
      </div>
      
      {/* Document List Section */}
      <div className="flex border-b border-gray-300 pb-2 mb-2 font-bold">
        <div className="flex-3 p-1">Dokumen</div>
        <div className="flex-1 p-1 text-center">Upload</div>
      </div>
      
      {documents.map((doc, index) => (
        <div key={index} className="flex border-b border-gray-300 py-2">
          <div className="flex-grow p-1">{doc}</div>
          <div className="w-24 p-1 text-center">
            <button className="bg-red-600 text-white border-none py-1 px-2 rounded-md cursor-pointer">
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}