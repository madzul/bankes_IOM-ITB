"use client"

import { signOut, useSession } from "next-auth/react";
import type React from "react"
import Image from "next/image"
import { User, FileUp, GraduationCap, Calendar, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";

type NavItem = {
  id: string
  label: string
  link: string
  icon: React.ReactNode
}

type SidebarMahasiswaProps = {
  activeTab: string
}

export default function SidebarMahasiswa({ activeTab }: SidebarMahasiswaProps) {
    const { data: session } = useSession();
    const [name, setName] = useState<string | null>(null);
  
    useEffect(() => {
      const fetchUserName = async () => {
        if (session?.user?.id) {
          const response = await fetch(`/api/users`);
          if (response.ok) {
            const user = await response.json();
            setName(user.name);
          }
        }
      };
  
      fetchUserName();
    }, [session]);
  const router = useRouter()

  const navItems: NavItem[] = [
    {
      id: "profile",
      label: "Profil",
      link: "/student/profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      id: "scholarship",
      label: "Beasiswa Saya",
      link: "/student/scholarship",
      icon: <GraduationCap className="h-5 w-5" />,
    },
    {
      id: "upload",
      label: "Unggah Dokumen",
      link: "/student/upload",
      icon: <FileUp className="h-5 w-5" />,
    },
    {
      id: "interview",
      label: "Interwiew",
      link: "/student/interview",
      icon: <Calendar className="h-5 w-5" />,
    },
  ]

  const handleNavigation = (link: string) => {
    router.push(link)
  }

  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm transition-all">
        {/* Header with updated styling */}
        <div className="p-6 text-center bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="relative w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden shadow-md">
            <Image
              src="/stolz.png"
              alt="Profile picture"
              fill
              className="object-cover"
            />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">{name}</h2>
          <p className="text-sm text-gray-600 mt-1">Mahasiswa</p>
        </div>

        {/* Navigation with modern styling */}
        <div className="py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.link)}
              className={cn(
                "flex items-center w-full px-6 py-3 text-left transition-colors",
                activeTab === item.id 
                  ? "bg-blue-50 text-blue-600 font-medium" 
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <span className={`mr-3 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {activeTab === item.id && (
                <div className="ml-auto w-1 h-6 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
          <div className="mx-4 my-2 border-t border-gray-100"></div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center w-full px-6 py-3 text-left transition-colors text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            <span className="mr-3 text-gray-500">
              <LogOut className="h-5 w-5" />
            </span>
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  )
}