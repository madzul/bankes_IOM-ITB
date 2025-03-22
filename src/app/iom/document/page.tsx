"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import SidebarIOM from "@/app/components/layout/sidebariom";
import { useSession } from "next-auth/react";
import axios from "axios";

interface Student {
  id: number;
  nim: string;
  user: {
    name: string;
  };
  files: {
    id: number;
    file_name: string;
    file_url: string;
    type: string;
  }[];
}

const fileTypes = [
  { title: "KTP", key: "KTP" },
  { title: "CV", key: "CV" },
  { title: "Transkrip Nilai", key: "Transkrip_Nilai" },
];

export default function Upload() {
  const [students, setStudents] = useState<Student[]>([]);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchFiles = async () => {
      if (session?.user?.id) {
        try {
          const response = await axios.get(`/api/files/fetch`);
          setStudents(response.data);
        } catch (error) {
          console.error("Error fetching files:", error);
        }
      }
    };

    fetchFiles();
  }, []);
  

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-1/4 m-8">
        <SidebarIOM activeTab="document" />
      </div>

      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Berkas Mahasiswa</h1>

        <Card className="p-8 w-full">
          {/* <table className="w-full ">
            <thead>
              <tr className="">
                <th className="border border-gray-300 px-4 py-2">NIM</th>
                <th className="border border-gray-300 px-4 py-2">Name</th>
                {fileTypes.map((file) => (
                  <th key={file.key} className="border border-gray-300 px-4 py-2">
                    {file.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">{student.nim}</td>
                    <td className="border border-gray-300 px-4 py-2">{student.user.name}</td>
                    {fileTypes.map((file) => (
                      <td key={file.key} className="border border-gray-300 px-4 py-2">
                        {renderFile(student.files, file.key)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={fileTypes.length + 2} className="text-center py-4">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table> */}
          Coming Soon!
        </Card>
      </div>
    </div>
  );
}

const renderFile = (files: Student["files"], type: string) => {
  const file = files.find((f) => f.type === type);
  return file ? (
    <a
      href={file.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:underline"
    >
      {file.file_name}
    </a>
  ) : (
    <span className="text-gray-500">No File</span>
  );
};
