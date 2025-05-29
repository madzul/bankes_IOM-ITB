"use client"

import { signOut, useSession } from "next-auth/react";
import type React from "react"
import { User, FileUp, GraduationCap, Calendar, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { memo, useEffect, useState } from "react";
import Image from "next/image";
import NotificationBell from '@/components/ui/notificationBell';
import { useUser } from "@/app/contexts/UserContext";


type NavItem = {
  id: string
  label: string
  link: string
  icon: React.ReactNode
}

type SidebarMahasiswaProps = {
  activeTab: string
}

function SidebarMahasiswa({ activeTab }: SidebarMahasiswaProps) {
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter()
  const [isDataFetched, setIsDataFetched] = useState(false);
  const { userName, isLoading } = useUser();



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
      label: "Interview",
      link: "/student/interview",
      icon: <Calendar className="h-5 w-5" />,
    },
  ]

  const handleNavigation = (link: string) => {
    router.push(link)
  }

  return (
    <div className={cn("fixed left-0 top-0 h-screen bg-white shadow-lg transition-all duration-300 z-40 border-r",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "absolute top-6 bg-white border rounded-full p-1.5 shadow-md hover:shadow-lg transition-shadow z-20",
          isCollapsed ? "-right-2" : "-right-3"
        )}
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
            {isCollapsed && (
              <div className="absolute left-1/2 transform -translate-x-1/2 top-16 bg-white border rounded-full p-1 shadow-md z-10">
                <NotificationBell />
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-2">
                <h2 className="text-lg font-semibold text-gray-800 break-words leading-tight">{userName || "Mahasiswa"}</h2>
                <p className="text-sm text-gray-600">Mahasiswa</p>
              </div>
              <div className="flex-shrink-0">
                <NotificationBell />
              </div>
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

export default memo(SidebarMahasiswa);
