"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import SidebarIOM from "@/app/components/layout/sidebariom";
import { useSession } from "next-auth/react";

interface Student {
  id: number;
  nim: string;
  User: {
    name: string;
  };
  Files: {
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
        const response = await fetch(`/api/files/fetch`);
        if (response.ok) {
          const data = await response.json();
          setStudents(data.data);
        } 
      }
    };

    fetchFiles();
  }, [session]);
  

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-1/4 m-8">
        <SidebarIOM activeTab="document" />
      </div>

      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Berkas Mahasiswa</h1>

        <Card className="p-8 w-full">
          <table className="w-full ">
            <thead>
              <tr className="">
                <th className="px-4 py-2">NIM</th>
                <th className="px-4 py-2">Name</th>
                {fileTypes.map((file) => (
                  <th key={file.key} className="px-4 py-2">
                    {file.key.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, id) => (
                <tr key={id}>
                  <td className="px-4 py-2 text-center">{student.nim}</td>
                  <td className="px-4 py-2 text-center">{student.User.name}</td>
                  {fileTypes.map((fileType) => {
                    const file = student.Files.find((f) => f.type === fileType.key);
                    return (
                      <td key={fileType.key} className="px-4 py-2 text-center">
                        {file ? (
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {file.type}
                          </a>
                        ) : (
                          <span className="text-gray-500">Not Uploaded</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

