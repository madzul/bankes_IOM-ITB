"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import SidebarIOM from "@/app/components/layout/sidebariom";
import { Toaster, toast } from "sonner";
import axios from "axios";
import { Search, FileText, Users, CheckCircle2, XCircle, Download, Filter, RefreshCw } from "lucide-react";

export interface Period {
  period_id: number;
  period: string;
  start_date: Date;
  end_date: Date;
  is_current: boolean;
}

interface File {
  file_id: number;
  file_url: string;
  file_name: string;
  type: string;
}

interface Status {
  passDitmawa: boolean;
  passIOM: boolean;
}

export interface Student {
  student_id: number;
  period_id: number;
  passDitmawa: boolean;
  passIOM: boolean;
  Student: {
    nim: string;
    User: {
      user_id: number;
      name: string;
    };
    Files: File[];
    Statuses: Status[];
  };
}

export default function Upload() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const filteredStudents = students.filter((student) =>
    student.Student.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.Student.User.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);  

  const [fileTypes, setFileTypes] = useState<{ title: string; key: string }[]>([]);
  
  const areAllFilesUploaded = (studentFiles: File[]) => {
    const requiredTypes = new Set(fileTypes.map((type) => type.key));
    const uploadedTypes = new Set(studentFiles.map((file) => file.type));
    
    return [...requiredTypes].every((type) => uploadedTypes.has(type));
  };

  useEffect(() => {
    const fetchFileTypes = async () => {
      try {
        const response = await axios.get("/api/files/file-types");
        if (response.data.success) {
          setFileTypes(response.data.data);
        } else {
          toast.error(response.data.error || "Failed to load file types.");
        }
      } catch (error) {
        console.error("Error fetching file types:", error);
        toast.error("An error occurred while loading file types.");
      }
    };
  
    fetchFileTypes();
  }, []);

  useEffect(() => {
    async function fetchPeriodsAndStudentFiles() {
      try {
        setLoading(true);
        const periodResponse = await fetch("/api/periods");
        if (!periodResponse.ok) {
          throw new Error("Failed to fetch periods");
        }
        const periodsData: Period[] = await periodResponse.json();
        setPeriods(periodsData);
        const currentPeriod = periodsData.find((period: Period) => period.is_current);
        setSelectedPeriod(currentPeriod || null);
        if (!currentPeriod?.period_id) {
          setStudents([]);
          return;
        }
        const fileResponse = await fetch("/api/files/fetch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ period_id: currentPeriod.period_id }),
        });
        if (!fileResponse.ok) {
          throw new Error("Failed to fetch student files");
        }
        const fileData = await fileResponse.json();
        if (fileData.success) {
          setStudents(fileData.data);
        } else {
          console.error("Error fetching student files:", fileData.error);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPeriodsAndStudentFiles();
  }, []);

  const handlePeriodChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      setLoading(true);
      const selectedId = event.target.value;
      const selected = periods.find((period) => period.period_id === parseInt(selectedId, 10));
      setSelectedPeriod(selected || null);
      if (selected) {
        const fileResponse = await fetch("/api/files/fetch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ period_id: selected?.period_id }),
        });
        if (!fileResponse.ok) {
          throw new Error("Failed to fetch student files");
        }
        const fileData = await fileResponse.json();
        if (fileData.success) {
          setStudents(fileData.data);
        } else {
          console.error("Error fetching student files:", fileData.error);
        }
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (
    studentId: number,
    field: "passDitmawa" | "passIOM",
    value: boolean
  ) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.student_id === studentId
          ? { ...student, [field]: value }
          : student
      )
    );
  };

  const handleUpdateStatuses = async () => {
    setIsUpdating(true);
    try {
      const studentsToUpdate = students.map((student) => ({
        student_id: student.student_id,
        period_id: selectedPeriod?.period_id || 0,
        Statuses: [{ passDitmawa: student.passDitmawa, passIOM: student.passIOM }],
      }));

      const response = await fetch("/api/status/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentsToUpdate),
      });

      const result = await response.json();
      if (result.error) {
        toast.error("Pembaharuan mengalami error.");
      } else {
        toast.info("Pembaharuan telah dilakukan.");
      }
    } catch (error) {
      console.error("Error updating student statuses:", error);
      toast.error("An error occurred while updating student statuses.");
    } finally {
      setIsUpdating(false);
    }
  };

  const completedCount = students.filter(student => areAllFilesUploaded(student.Student.Files)).length;
  const passedDitmawa = students.filter(student => student.passDitmawa).length;
  const passedIOM = students.filter(student => student.passIOM).length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster position="bottom-right" richColors />
      
      {/* Sidebar */}
      <div className="w-80 p-6">
        <SidebarIOM activeTab="document" />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Berkas Mahasiswa
              </h1>
              <p className="text-slate-600 mt-1">Kelola dan verifikasi dokumen mahasiswa</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{students.length}</p>
                  <p className="text-sm text-slate-600">Total Mahasiswa</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
                  <p className="text-sm text-slate-600">Berkas Lengkap</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{passedDitmawa}</p>
                  <p className="text-sm text-slate-600">Lolos Ditmawa</p>
                </div>
              </div>
            </Card>

            {/* <Card className="p-4 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{passedIOM}</p>
                  <p className="text-sm text-slate-600">Lolos IOM</p>
                </div>
              </div>
            </Card> */}
          </div>

          {/* Controls */}
          <Card className="p-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              
              {/* Period Selector */}
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-slate-600" />
                <div className="relative">
                  <select
                    className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm min-w-[280px]"
                    value={selectedPeriod?.period_id || ""}
                    onChange={handlePeriodChange}
                  >
                    <option value="">Pilih Periode</option>
                    {periods.map((period) => (
                      <option key={period.period_id} value={period.period_id}>
                        {period.period} {period.is_current ? "(Sekarang)" : ""}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <Search className="h-5 w-5 text-slate-600" />
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Cari nama atau NIM mahasiswa..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Data Table */}
          {loading ? (
            <Card className="p-12 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-3 text-lg text-slate-600">Loading...</span>
              </div>
            </Card>
          ) : selectedPeriod ? (
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                        NIM
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                        Nama Mahasiswa
                      </th>
                      {fileTypes.map(({ title, key }) => (
                        <th
                          key={key}
                          className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200"
                        >
                          {title}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                        Ditmawa
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                        IOM
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentStudents.map((student, index) => (
                      <tr 
                        key={student.student_id} 
                        className={`hover:bg-slate-50/50 transition-colors ${
                          index % 2 === 0 ? 'bg-white/50' : 'bg-slate-50/30'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono text-sm font-medium text-slate-900">
                            {student.Student.nim}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {student.Student.User.name}
                          </div>
                        </td>
                        {fileTypes.map(({ key, title }) => {
                          const file = student.Student.Files.find((f) => f.type === key);
                          return (
                            <td key={key} className="px-6 py-4 whitespace-nowrap text-center">
                              {file ? (
                                <a
                                  href={file.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-full hover:bg-green-200 transition-colors"
                                >
                                  <Download className="h-3 w-3" />
                                  Lihat
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                  <XCircle className="h-3 w-3" />
                                  Belum Upload
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={student.passDitmawa}
                              onChange={(e) =>
                                handleCheckboxChange(
                                  student.student_id,
                                  "passDitmawa",
                                  e.target.checked
                                )
                              }
                              className="sr-only"
                            />
                            <div className={`relative w-6 h-6 rounded-md border-2 transition-all ${
                              student.passDitmawa 
                                ? 'bg-purple-600 border-purple-600' 
                                : 'bg-white border-slate-300 hover:border-purple-400'
                            }`}>
                              {student.passDitmawa && (
                                <CheckCircle2 className="h-4 w-4 text-white absolute top-0.5 left-0.5" />
                              )}
                            </div>
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={student.passIOM}
                                onChange={(e) =>
                                  handleCheckboxChange(
                                    student.student_id,
                                    "passIOM",
                                    e.target.checked
                                  )
                                }
                                disabled={!areAllFilesUploaded(student.Student.Files)}
                                className="sr-only"
                              />
                              <div className={`relative w-6 h-6 rounded-md border-2 transition-all ${
                                !areAllFilesUploaded(student.Student.Files)
                                  ? 'bg-slate-100 border-slate-200 cursor-not-allowed'
                                  : student.passIOM 
                                    ? 'bg-orange-600 border-orange-600' 
                                    : 'bg-white border-slate-300 hover:border-orange-400'
                              }`}>
                                {student.passIOM && areAllFilesUploaded(student.Student.Files) && (
                                  <CheckCircle2 className="h-4 w-4 text-white absolute top-0.5 left-0.5" />
                                )}
                              </div>
                            </label>
                            {!areAllFilesUploaded(student.Student.Files) && (
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                Berkas belum lengkap
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Menampilkan {indexOfFirstStudent + 1}-{Math.min(indexOfLastStudent, filteredStudents.length)} dari {filteredStudents.length} data
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let startPage = Math.max(1, currentPage - 2);
                        if (currentPage >= totalPages - 2) startPage = Math.max(1, totalPages - 4);
                        if (currentPage <= 3) startPage = 1;

                        const page = startPage + i;
                        if (page > totalPages) return null;

                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
              <div className="text-center text-slate-600">
                <FileText className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg">Pilih periode untuk melihat data mahasiswa</p>
              </div>
            </Card>
          )}

          {/* Action Button */}
          {selectedPeriod && students.length > 0 && (
            <div className="flex justify-end">
              <button
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                onClick={handleUpdateStatuses}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Memperbarui...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}