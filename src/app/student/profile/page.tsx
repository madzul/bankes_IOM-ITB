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

        <Card className="p-8 w-full max-w-2xl">
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="flex items-center space-x-6 pb-6 border-b border-gray-200">
              {/* <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-var rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {name?.charAt(0) || 'M'}
              </div> */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
                <p className="text-gray-600">{nim}</p>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Nama Lengkap</h3>
                </div>
                <p className="text-lg font-medium text-gray-800">{name}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 10h.01M12 14h4M8 10h4M8 14h.01" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">NIM</h3>
                </div>
                <p className="text-lg font-medium text-gray-800">{nim}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Program Studi</h3>
                </div>
                <p className="text-lg font-medium text-gray-800">{prodi}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Fakultas</h3>
                </div>
                <p className="text-lg font-medium text-gray-800">{fakultas}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

