"use client"

import type React from "react"
import { Calendar, ChartColumn, File, Lock, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

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
      id: "password",
      label: "Ubah Password",
      link: "/iom/change-password",
      icon: <Lock className="h-5 w-5" />,
    },
    {
      id: "logout",
      label: "Keluar",
      link: "/",
      icon: <LogOut className="h-5 w-5" />,
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
          <h2 className="text-xl font-semibold">Alisa Mikhailovna Kujou</h2>
          <p className="text-sm">Orang Tua Mahasiswa</p>
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
        </div>
      </div>
    </div>
  )
}