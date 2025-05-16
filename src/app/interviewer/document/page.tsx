"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import axios from "axios";
import SidebarInterviewer from "@/app/components/layout/sidebarinterviewer";

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

interface Student {
  student_id: number;
  period_id: number;
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

  useEffect(() => {
    async function fetchFileTypes() {
      try {
        const response = await axios.get("/api/files/file-types");
        if (response.data.success) setFileTypes(response.data.data);
        else toast.error(response.data.error || "Failed to load file types.");
      } catch {
        toast.error("An error occurred while loading file types.");
      }
    }
    fetchFileTypes();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const periodsRes = await fetch("/api/periods");
        if (!periodsRes.ok) throw new Error();
        const periodsData: Period[] = await periodsRes.json();
        setPeriods(periodsData);

        const current = periodsData.find((p) => p.is_current);
        setSelectedPeriod(current || null);
        if (!current?.period_id) {
          setStudents([]);
          return;
        }

        const filesRes = await fetch("/api/files/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period_id: current.period_id }),
        });
        if (!filesRes.ok) throw new Error();
        const filesData = await filesRes.json();
        if (filesData.success) setStudents(filesData.data);
      } catch {
        console.error("Error fetching data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handlePeriodChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = parseInt(e.target.value, 10);
    setSelectedPeriod(periods.find((p) => p.period_id === pid) || null);
    if (pid) {
      setLoading(true);
      const res = await fetch("/api/files/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period_id: pid }),
      });
      const data = await res.json();
      if (data.success) setStudents(data.data);
      setLoading(false);
    } else {
      setStudents([]);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="bottom-right" richColors />
      <div className="w-1/4 m-8">
        <SidebarInterviewer activeTab="document" />
      </div>
      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Berkas Mahasiswa</h1>
        <Card className="p-8 w-[70dvw]">
          {loading ? (
            <p className="text-lg">Loading...</p>
          ) : (
            <>
              <select
                className="block w-[300px] px-3 py-2 bg-white border rounded-md"
                value={selectedPeriod?.period_id || ""}
                onChange={handlePeriodChange}
              >
                <option value="">Pilih Periode</option>
                {periods.map((p) => (
                  <option key={p.period_id} value={p.period_id}>
                    {p.period} {p.is_current ? "(Current)" : ""}
                  </option>
                ))}
              </select>

              <div className="mt-4 w-[300px]">
                <label htmlFor="search" className="block text-sm font-medium mb-1">Cari Nama/NIM:</label>
                <input
                  id="search"
                  type="text"
                  placeholder="Masukkan Nama atau NIM"
                  className="px-4 py-2 border rounded-md w-full"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>

              {selectedPeriod && (
                <div className="overflow-x-auto border rounded-md mt-4">
                  <table className="min-w-full divide-y">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left uppercase">NIM</th>
                        <th className="px-6 py-3 text-left uppercase">Nama</th>
                        {fileTypes.map(({ title, key }) => (
                          <th key={key} className="px-6 py-3 text-left uppercase">{title}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y">
                      {currentStudents.map((st) => (
                        <tr key={st.student_id}>
                          <td className="px-6 py-4">{st.Student.nim}</td>
                          <td className="px-6 py-4">{st.Student.User.name}</td>
                          {fileTypes.map(({ key }) => {
                            const file = st.Student.Files.find((f) => f.type === key);
                            return (
                              <td key={key} className="px-6 py-4">
                                {file ? (
                                  <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {file.file_name}
                                  </a>
                                ) : (
                                  <span className="text-gray-500">Not Uploaded</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center gap-2 mt-4">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border rounded hover:bg-gray-200 disabled:opacity-50"
                >Previous</button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded ${currentPage === page ? "bg-blue-600 text-white" : "border hover:bg-gray-200"}`}>
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border rounded hover:bg-gray-200 disabled:opacity-50"
                >Next</button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
