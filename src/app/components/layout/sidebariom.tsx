"use client"

import type React from "react"
import { Calendar, ChartColumn, File, Lock, LogOut, BookText, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type NavItem = {
  id: string
  label: string
  link: string
  icon: React.ReactNode
}

type SidebarIOMProps = {
  activeTab: string
}

export default function SidebarIOM({ activeTab }: SidebarIOMProps) {
  const router = useRouter()
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

  const navItems: NavItem[] = [
    {
      id: "document",
      label: "Berkas Mahasiswa",
      link: "/iom/document",
      icon: <File className="h-5 w-5" />,
    },
    {
      id: "interview",
      label: "Jadwal Wawancara",
      link: "/iom/interview",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      id: "statistic",
      label: "Statistik Mahasiswa",
      link: "/iom/statistic",
      icon: <ChartColumn className="h-5 w-5" />,
    },
    {
      id: "form",
      label: "Form Interview",
      link: "/iom/form",
      icon: <BookText className="h-5 w-5" />,
    },
    {
      id: "scoring",
      label: "Penilaian Mahasiswa",
      link: "/iom/scoring",
      icon: <Star className="h-5 w-5" />,
    },
    {
      id: "password",
      label: "Ubah Password",
      link: "/iom/change-password",
      icon: <Lock className="h-5 w-5" />,
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
          <h2 className="text-xl font-semibold">{name}</h2>
          <p className="text-sm">Pengurus IOM</p>
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