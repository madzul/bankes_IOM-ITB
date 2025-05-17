"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import SidebarIOM from "@/app/components/layout/sidebariom";
import * as XLSX from "xlsx";
import { FileDown } from "lucide-react";

interface Period {
  period_id: number;
  period: string;
  start_date: Date;
  end_date: Date;
  is_current: boolean;
}

interface ReportStudent {
  amount: number;
  Student: {
    nim: string;
    student_id: number;
    faculty: string;
    major: string;
    User?: {
      name?: string;
    };
  };
}

export default function ReportPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [students, setStudents] = useState<ReportStudent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPeriods() {
      setLoading(true);
      try {
        const res = await fetch("/api/periods");
        const data: Period[] = await res.json();
        setPeriods(data);
        const current = data.find((p) => p.is_current);
        setSelectedPeriod(current || null);
      } catch {
        setPeriods([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPeriods();
  }, []);

  useEffect(() => {
    async function fetchReport() {
      if (!selectedPeriod) {
        setStudents([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/report/${selectedPeriod.period_id}`);
        if (!res.ok) {
          setStudents([]);
          return;
        }
        const data = await res.json();
        console.log("Fetched students:", data); // <-- Debug output
        setStudents(data);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [selectedPeriod]);

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value, 10);
    const period = periods.find((p) => p.period_id === id) || null;
    setSelectedPeriod(period);
  };

  const handleExportXLSX = () => {
    if (!students.length) return;
    const data = students.map((item) => ({
      NIM: item.Student.nim,
      Nama: item.Student.User?.name || "-",
      Fakultas: item.Student.faculty,
      Jurusan: item.Student.major,
      "Nominal Bantuan": item.amount,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const filename = selectedPeriod
      ? `report_${selectedPeriod.period.replace(/\s+/g, "_")}.xlsx`
      : "report.xlsx";
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-1/4 m-8">
        <SidebarIOM activeTab="report" />
      </div>
      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Berita Acara</h1>
        <Card className="p-8 w-[70dvw]">
          <select
            className="block w-[300px] px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={selectedPeriod?.period_id || ""}
            onChange={handlePeriodChange}
          >
            <option value="">Pilih Periode</option>
            {periods.map((period) => (
              <option key={period.period_id} value={period.period_id}>
                {period.period} {period.is_current ? "(Current)" : ""}
              </option>
            ))}
          </select>
          <div className="mt-6">
            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="max-w-full overflow-x-auto border border-gray-300 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium min-w-32 uppercase tracking-wider">NIM</th>
                      <th className="px-6 py-3 text-left text-xs font-medium min-w-32 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium min-w-32 uppercase tracking-wider">Fakultas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium min-w-32 uppercase tracking-wider">Jurusan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium min-w-32 uppercase tracking-wider">Nominal Bantuan</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          Tidak ada data mahasiswa untuk periode ini.
                        </td>
                      </tr>
                    ) : (
                      students.map((item) => (
                        <tr key={item.Student.student_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Student.nim}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {/* Show name if available, else "-" */}
                            {item.Student.User?.name
                              ? item.Student.User.name
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Student.faculty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Student.major}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.amount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex justify-end mb-4">
            <button
              className="mt-4 px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              onClick={handleExportXLSX}
              disabled={!students.length}
            >
              <FileDown size={18} />
              Export
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
