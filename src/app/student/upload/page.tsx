"use client";

import { Card } from "@/components/ui/card";
import SidebarMahasiswa from "@/app/components/layout/sidebarmahasiswa";
import { useState, useEffect } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { useSession } from "next-auth/react";

const bucketName: string = process.env.MINIO_BUCKET_NAME || "iom-itb";

interface UploadResponse {
  success: boolean;
  fileName?: string;
  fileUrl?: string;
  error?: string;
}

interface FileData {
  file_url: string;
  file_name: string;
  type: string;
}

const fileTypes = [
  { title: "KTP", key: "KTP" },
  { title: "CV", key: "CV" },
  { title: "Transkrip Nilai", key: "Transkrip_Nilai" },
];

export default function Upload() {
  const { data: session } = useSession();
  
  const [selectedFiles, setSelectedFiles] = useState<{ key: string; file: File }[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (session?.user?.id) {
        try {
          const response = await axios.get<FileData[]>(`/api/files/fetch/${session.user.id}`);
          setUploadedFiles(response.data);
        } catch (error) {
          console.error("Error fetching files:", error);
        }
      }
    };

    fetchFiles();
  }, [session]);

  const handleFileSelect = (key: string, file: File) => {
    setSelectedFiles((prev) => [...prev.filter(f => f.key !== key), { key, file }]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("No files selected.");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach(({ key, file }) => {
      formData.append("files", file);
      formData.append("documentTypes", key);
    });

    try {
      const response = await axios.post<UploadResponse>("/api/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          bucket: bucketName,
        },
      });

      if (response.data.success) {
        toast.success("All files uploaded successfully");
        setSelectedFiles([]);
        location.reload();
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("An error occurred while uploading the files.");
    }
  };

  const handleDelete = async (fileType: string) => {
    try {
      const response = await axios.delete("/api/files/delete", {
        data: { fileType }, 
      });
  
      if (response.data.success) {
        toast.success("File deleted successfully");
        setUploadedFiles((prev) => prev.filter((file) => file.type !== fileType)); // Update UI
      } else {
        toast.error(response.data.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("An error occurred while deleting the file.");
    }
  };
  

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="bottom-right" richColors />
      <div className="w-1/4 m-8">
        <SidebarMahasiswa activeTab="upload" />
      </div>

      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Unggah Dokumen</h1>

        <Card className="p-8 w-full">
          {fileTypes.map((type) => {
            const existingFile = uploadedFiles.find((file) => file.type === type.key);

            return (
              <div key={type.key} className="mb-4">
                <h2 className="text-lg font-semibold mb-2">{type.title}</h2>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileSelect(type.key, file);
                    }
                  }}
                  className="mb-2 border-2 w-[20dvw] border-gray-400 hover:border-black hover:cursor-pointer rounded-xl h-full py-2 px-2"
                />
                {existingFile && (
                  <div className="flex gap-4 items-center">
                    <a
                      href={existingFile.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      File {existingFile.type.replace(/_/g, " ")}
                    </a>
                    <button
                      onClick={() => handleDelete(existingFile.type)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <button
            onClick={handleUpload}
            className="bg-[#003793] text-white px-4 py-2 rounded-md hover:bg-[#b5c3e1] w-[20dvw]"
          >
            Simpan
          </button>
        </Card>
      </div>
    </div>
  );
}
