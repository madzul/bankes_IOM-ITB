"use client";
import SidebarIOM from "@/app/components/layout/sidebariom";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function Scoring() {

  return (
      <div className="flex min-h-screen bg-gray-100">
        <div className="w-1/4 m-8">
          <SidebarIOM activeTab="scoring" />
        </div>
        <div className="my-8 mr-8 w-full">
          <h1 className="text-2xl font-bold mb-6">Penilaian Mahasiswa</h1>
          <Card className="p-8 w-[70dvw]"></Card>
        </div>
      </div>
  )
}