"use client";

import { Card } from "@/components/ui/card";
import SidebarMahasiswa from "@/app/components/layout/sidebarmahasiswa";
import { useState } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner"; 

interface UploadResponse {
  success: boolean;
  fileName?: string;
  fileUrl?: string;
  error?: string;
}

export default function Upload() {
  const fileTypes = [
    { title: "KTP", key: "KTP" },
    { title: "CV", key: "CV" },
    { title: "Transkrip Nilai", key: "Transkrip_Nilai" },
  ];

  const [uploadedFiles, setUploadedFiles] = useState<
    { key: string; fileName: string; fileUrl: string }[]
  >([]);

  const handleFileUpload = async (key: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", key);

    // TODO: make .env
    const minioConfig = {
      endPoint: "localhost",
      port: 9000,
      bucketName: "iom-itb",
      useSSL: false,
    };

    try {
      const response = await axios.post<UploadResponse>("/api/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          // TODO: authentication
        },
        params: {
          bucket: minioConfig.bucketName,
          documentType: key,
        },
      });

      if (response.data.success && response.data.fileName && response.data.fileUrl) {
        const { fileName, fileUrl } = response.data;

        setUploadedFiles((prev) => [
          ...prev,
          { key, fileName, fileUrl },
        ]);

        toast.success(`The file "${fileName}" has been uploaded successfully`, {
          style: {
            background: "#16a34a",
            color: "#ffffff",
          },
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);

      toast.error("An error occurred while uploading the file.", {
        style: {
          background: "#ef4444",
          color: "#ffffff",
        },
      });
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.fileName !== fileName));
  };

  // TODO: Fix API to Database
  // TODO: Fetch Database

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="bottom-right" richColors />

      <div className="w-1/4 m-8">
        <SidebarMahasiswa activeTab="upload" />
      </div>

      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Unggah Dokumen</h1>

        <Card className="p-8 w-full">
          {fileTypes.map((type) => (
            <div key={type.key} className="mb-4">
              <h2 className="text-lg font-semibold mb-2">{type.title}</h2>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(type.key, file);
                  }
                }}
                className="mb-2 border-2 w-[20dvw] border-gray-400 hover:border-black hover:cursor-pointer rounded-xl h-full py-2 px-2"
              />
              {uploadedFiles
                .filter((file) => file.key === type.key)
                .map((file) => (
                  <div key={file.fileName} className="flex items-center gap-2">
                    <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                      {file.fileName}
                    </a>
                    <button
                      onClick={() => handleRemoveFile(file.fileName)}
                      className="text-red-500 hover:text-red-700"
                    >
                      X
                    </button>
                  </div>
                ))}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}