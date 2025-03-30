import { Card } from "@/components/ui/card"
import SidebarIOM from "@/app/components/layout/sidebariom"

export default function Upload() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-1/4 m-8">
        <SidebarIOM activeTab="password"/>
      </div>

      {/* Main Content */}
      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Ganti Password</h1>

        <Card className="p-8 w-full">
          <p>Coming Soon!</p>
        </Card>
      </div>
    </div>
  )
}
