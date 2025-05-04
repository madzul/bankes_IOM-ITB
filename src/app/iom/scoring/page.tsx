"use client";
import SidebarIOM from "@/app/components/layout/sidebariom";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

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

export default function Scoring() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(students.length / itemsPerPage);

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

  return (
      <div className="flex min-h-screen bg-gray-100">
        <div className="w-1/4 m-8">
          <SidebarIOM activeTab="scoring" />
        </div>
        <div className="my-8 mr-8 w-full">
          <h1 className="text-2xl font-bold mb-6">Penilaian Mahasiswa</h1>
          <Card className="p-8 w-[70dvw]">
            {loading ? (
                <p className="text-lg">Loading...</p>
            ) : (
                <>
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

                  <div className="flex w-full gap-6 justify-between mt-6">
                    {selectedPeriod && (
                      <div className="flex flex-col gap-4 w-[500px]">
                        <div className="max-w-full border border-gray-300 rounded-md">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-2 py-4 text-left text-xs font-medium uppercase tracking-wider"
                                >
                                  NIM
                                </th>
                                <th
                                  scope="col"
                                  className="px-2 py-4 text-left text-xs font-medium uppercase tracking-wider"
                                >
                                  Nama
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {currentStudents.map((student) => (
                                <tr>
                                  <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">{student.Student.nim}</td>
                                  <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900">{student.Student.User.name}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex w-full justify-between items-center gap-2 mt-2">
                          <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-3 rounded border border-2 hover:bg-gray-200 text-sm disabled:opacity-50"
                          >
                            Previous
                          </button>

                          <div className="flex gap-4">
                            {Array.from({ length: 3 }, (_, i) => {
                              let startPage = Math.max(1, currentPage - 1);
                              if (currentPage === totalPages) startPage = totalPages - 2;
                              if (currentPage === 1) startPage = 1;

                              const page = startPage + i;
                              if (page > totalPages) return null;

                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-4 py-2 text-sm rounded ${
                                    currentPage === page
                                      ? "bg-blue-600 text-white"
                                      : "border border-2 hover:bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                            className="px-3 py-3 rounded border border-2 hover:bg-gray-200 text-sm disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="w-full h-full border border-gray-300 rounded-md p-4">
                      <p className="mb-2">Apakah mahasiswa mempunyai prestasi yang baik?</p>
                      <div className="flex justify-between items-center">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="prestasi"
                            value="kurang"
                            className="mr-2"
                            defaultChecked
                          />
                          <span>Kurang</span>
                        </label>

                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="prestasi"
                            value="cukup"
                            className="mr-2"
                          />
                          <span>Cukup</span>
                        </label>

                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="prestasi"
                            value="baik"
                            className="mr-2"
                          />
                          <span>Baik</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
            )}
          </Card>
        </div>
      </div>
  )
}