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
          const response = await fetch(`/api/users/${session.user.id}`);
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
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="relative w-24 h-24 mx-auto mb-3 rounded-md overflow-hidden bg-yellow-400">
            <Image
              src="/stolz.png"
              alt="Profile picture"
              fill
              className="object-cover"
            />
          </div>
          <h2 className="text-xl font-semibold">{name}</h2>
          <p className="text-sm">Kandidat</p>
        </div>

        {/* Navigation */}
        <div className="divide-y divide-gray-100">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.link)}
              className={cn(
                "flex items-center w-full px-6 py-3 text-left transition-colors cursor-pointer",
                activeTab === item.id ? "bg-blue-200 text-blue-800" : "hover:bg-gray-50",
              )}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "flex items-center w-full px-6 py-3 text-left transition-colors cursor-pointer hover:bg-gray-50"
            )}
          >
            <span className="mr-3">
              <LogOut className="h-5 w-5" />
            </span>
            <span>
              Keluar
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}