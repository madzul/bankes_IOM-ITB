"use client"

import { Card } from "@/components/ui/card"
import SidebarMahasiswa from "@/app/components/layout/sidebarmahasiswa"
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Account() {
  const { data: session } = useSession();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserName = async () => {
      if (session?.user?.id) {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (response.ok) {
          const user = await response.json();
          setName(user.name);
        }
      }
    };

    fetchUserName();
  }, [session]);



  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-1/4 m-8">
        <SidebarMahasiswa activeTab="profile"/>
      </div>

      {/* Main Content */}
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
              <p className="font-medium">{}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Program Studi</h3>
              <p className="font-medium">Teknik Informatika</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Angkatan</h3>
              <p className="font-medium"></p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

