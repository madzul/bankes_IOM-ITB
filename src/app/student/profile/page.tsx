"use client"

import { Card } from "@/components/ui/card"
import SidebarMahasiswa from "@/app/components/layout/sidebarmahasiswa"
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Account() {
  const { data: session } = useSession();
  const [name, setName] = useState<string | null>(null);
  const [nim, setNim] = useState<string | null>(null);
  const [prodi, setProdi] = useState<string | null>(null);
  const [fakultas, setFakultas] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserName = async () => {
      if (session?.user?.id) {
        try {
          // Fetch user data
          let response = await fetch(`/api/users`);
          if (response.ok) {
            const user = await response.json();
            setName(user.name);
          }

          // Fetch student data
          response = await fetch(`/api/student`);
          if (response.ok) {
            const student = await response.json();
            setNim(student.nim);
            setProdi(student.major);
            setFakultas(student.faculty);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserName();
  }, [session]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100 justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-1/4 m-8">
        <SidebarMahasiswa activeTab="profile"/>
      </div>

      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Profil</h1>

        <Card className="p-8 w-full">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nama</h3>
              <p className="font-medium">{name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">NIM</h3>
              <p className="font-medium">{nim}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Program Studi</h3>
              <p className="font-medium">{prodi}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Fakultas</h3>
              <p className="font-medium">{fakultas}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

