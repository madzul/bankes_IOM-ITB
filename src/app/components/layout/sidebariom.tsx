"use client"

import type React from "react"
import { Calendar, ChartColumn, File, LogOut, BookText, Star, Newspaper, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react";
import { memo, useEffect, useState } from "react";
import Image from "next/image";

type NavItem = {
  id: string
  label: string
  link: string
  icon: React.ReactNode
}

type SidebarIOMProps = {
  activeTab: string
}

function SidebarIOM({ activeTab }: SidebarIOMProps) {
  const router = useRouter()
  const { data: session } = useSession();
  const [name, setName] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      id: "report",
      label: "Berita Acara",
      link: "/iom/report",
      icon: <Newspaper className="h-5 w-5" />,
    },
  ]

  const handleNavigation = (link: string) => {
    router.push(link)
  }

  return (
    <div className={cn(
      "fixed left-0 top-0 h-screen bg-white shadow-lg transition-all duration-300 z-50 border-r",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border rounded-full p-1.5 shadow-md hover:shadow-lg transition-shadow"
      >
        {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </button>

      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Image 
              src="/logoIOM.png" 
              alt="IOM logo" 
              width={32} 
              height={32}
              className="flex-shrink-0"
            />
            {isCollapsed && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                IOM ITB
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-800 truncate">{name || "Pengurus IOM"}</h2>
              <p className="text-sm text-gray-600">Pengurus IOM</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4">
        {navItems.map((item) => (
          <div key={item.id} className="relative group">
            <button
              onClick={() => handleNavigation(item.link)}
              className={cn(
                "w-full flex items-center px-4 py-3 text-left transition-colors hover:bg-gray-50",
                activeTab === item.id ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700" : "text-gray-700"
              )}
            >
              <span className={cn(
                "flex-shrink-0",
                activeTab === item.id ? "text-blue-700" : "text-gray-500"
              )}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="ml-3 truncate">{item.label}</span>
              )}
            </button>
            {isCollapsed && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {item.label}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Logout Button */}
      <div className="border-t p-4">
        <div className="relative group">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center px-4 py-3 text-left transition-colors hover:bg-gray-50 text-gray-700"
          >
            <LogOut className="h-5 w-5 flex-shrink-0 text-gray-500" />
            {!isCollapsed && (
              <span className="ml-3">Keluar</span>
            )}
          </button>
          {isCollapsed && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Keluar
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(SidebarIOM);
