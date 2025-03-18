import { Card } from "@/components/ui/card"
import SidebarMahasiswa from "@/app/components/layout/sidebarmahasiswa"

export default function Account() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-1/4 m-8">
        <SidebarMahasiswa activeTab="profile"/>
      </div>

      {/* Main Content */}
      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Profil</h1>

        <Card className="p-8 w-full">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nama</h3>
              <p className="font-medium">Kamisato Ayaka</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">NIM</h3>
              <p className="font-medium">13522999</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Program Studi</h3>
              <p className="font-medium">Teknik Informatika</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Semester</h3>
              <p className="font-medium">3</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">UKT</h3>
              <p className="font-medium">Rp. 12,500,000</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

