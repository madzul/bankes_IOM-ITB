"use client";

import { Card } from "@/components/ui/card";
import SidebarIOM from "@/app/components/layout/sidebariom";
import { useEffect, useState } from "react";

type Student = {
  id: number;
  name: string;
  nim: string;
};

// TODO: Guard
// TODO: Periode

export default function Upload() {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const response = await fetch("/api/users/students");
        const data: Student[] = await response.json();
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    }

    fetchStudents();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-1/4 m-8">
        <SidebarIOM activeTab="document" />
      </div>

      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Berkas Mahasiswa</h1>

        <Card className="p-8 w-full">
          <table>
            <thead>
              <tr>
                <th>NIM</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.nim}</td>
                  <td>{student.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
