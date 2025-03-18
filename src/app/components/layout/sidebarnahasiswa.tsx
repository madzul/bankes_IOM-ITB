"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { User, FileUp, GraduationCap, Lock, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  id: string
  label: string
  icon: React.ReactNode
}

export default function SidebarMahasiswa() {
  const [activeTab, setActiveTab] = useState("profile")

  const navItems: NavItem[] = [
    {
      id: "profile",
      label: "Profil",
      icon: <User className="h-5 w-5" />,
    },
    {
      id: "upload",
      label: "Unggah Dokumen",
      icon: <FileUp className="h-5 w-5" />,
    },
    {
      id: "scholarship",
      label: "Beasiswa Saya",
      icon: <GraduationCap className="h-5 w-5" />,
    },
    {
      id: "password",
      label: "Ubah Password",
      icon: <Lock className="h-5 w-5" />,
    },
    {
      id: "logout",
      label: "Keluar",
      icon: <LogOut className="h-5 w-5" />,
    },
  ]

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
          <h2 className="text-xl font-semibold">Kamisato Ayaka</h2>
          <p className="text-sm">Kandidat</p>
        </div>

        {/* Navigation */}
        <div className="divide-y divide-gray-100">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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