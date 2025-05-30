"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import SidebarIOM from "@/app/components/layout/sidebariom";
import * as XLSX from "xlsx";
import { FileDown, Calendar, Users, TrendingUp, Download } from "lucide-react";

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

  const totalAmount = students.reduce((sum, student) => sum + student.amount, 0);
  const totalStudents = students.length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="w-1/4 m-8">
        <SidebarIOM activeTab="report" />
      </div>
      
      <div className="my-8 mr-8 w-full space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Berita Acara
            </h1>
            <p className="text-slate-600 mt-2">Laporan bantuan mahasiswa per periode</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            <span>Periode Akademik</span>
          </div>
        </div>

        {/* Stats Cards */}
        {selectedPeriod && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6 border-0 shadow-md bg-white/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Mahasiswa</p>
                  <p className="text-3xl font-bold text-slate-800">{totalStudents}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
            
            <Card className="p-6 border-0 shadow-md bg-white/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Bantuan</p>
                  <p className="text-3xl font-bold text-slate-800">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </Card>
            
            <Card className="p-6 border-0 shadow-md bg-white/70 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Rata-rata Bantuan</p>
                  <p className="text-3xl font-bold text-slate-800">
                    Rp {totalStudents > 0 ? Math.round(totalAmount/totalStudents).toLocaleString('id-ID') : 0}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Content Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          {/* Card Header */}
          <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative">
                <select
                  className="appearance-none bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-6 py-3 pr-12 text-slate-700 font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 min-w-[300px]"
                  value={selectedPeriod?.period_id || ""}
                  onChange={handlePeriodChange}
                >
                  <option value="">Pilih Periode</option>
                  {periods.map((period) => (
                    <option key={period.period_id} value={period.period_id}>
                      {period.period} {period.is_current ? "• Aktif" : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <button
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                onClick={handleExportXLSX}
                disabled={!students.length}
              >
                <Download className="w-5 h-5" />
                Export Excel
              </button>
            </div>
          </div>

          {/* Table Section */}
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
                  <p className="text-slate-600 font-medium">Memuat data...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          NIM
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Nama Mahasiswa
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Fakultas
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Program Studi
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                          Nominal Bantuan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-4 bg-slate-100 rounded-full">
                                <Users className="w-8 h-8 text-slate-400" />
                              </div>
                              <div>
                                <p className="text-slate-600 font-medium">Tidak ada data mahasiswa</p>
                                <p className="text-slate-500 text-sm">untuk periode yang dipilih</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        students.map((item, index) => (
                          <tr 
                            key={item.Student.student_id} 
                            className={`hover:bg-slate-50/50 transition-colors duration-150 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">
                                {item.Student.nim}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-900">
                                {item.Student.User?.name || (
                                  <span className="text-slate-400 italic">Nama tidak tersedia</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-700">
                                {item.Student.faculty}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-700">
                                {item.Student.major}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                                Rp {item.amount.toLocaleString('id-ID')}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}