"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import SidebarIOM from "@/app/components/layout/sidebariom";
import { Toaster, toast } from "sonner";
import axios from "axios";

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
      if (result.success) {
        toast.success("Student statuses updated successfully!");
      } else {
        toast.error("Failed to update student statuses.");
      }
    } catch (error) {
      console.error("Error updating student statuses:", error);
      toast.error("An error occurred while updating student statuses.");
    } finally {
      setIsUpdating(false);
    }
  };


  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="bottom-right" richColors />
      <div className="w-1/4 m-8">
        <SidebarIOM activeTab="document" />
      </div>
      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Berkas Mahasiswa</h1>
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
              <div className="mt-4 w-[300px]">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Cari Nama/NIM Mahasiswa:
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Masukkan Nama atau NIM"
                  className="px-4 py-2 border border-gray-300 rounded-md w-full max-w-md"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              {selectedPeriod && (
                <div className="max-w-full overflow-x-auto border border-gray-300 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium min-w-52 uppercase tracking-wider"
                        >
                          NIM
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium min-w-52 uppercase tracking-wider"
                        >
                          Nama
                        </th>
                        {fileTypes.map(({ title, key }) => (
                          <th
                            key={key}
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium min-w-52 uppercase tracking-wider"
                          >
                            {title}
                          </th>
                        ))}
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium min-w-52 uppercase tracking-wider"
                        >
                          Lolos Seleksi Berkas Ditmawa?
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium min-w-52 uppercase tracking-wider"
                        >
                          Lolos Seleksi Berkas IOM?
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentStudents.map((student) => (
                        <tr key={student.student_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.Student.nim}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.Student.User.name}
                          </td>
                          {fileTypes.map(({ key, title }) => {
                            const file = student.Student.Files.find((f) => f.type === key);
                            return (
                              <td
                                key={key}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {file ? (
                                  <a
                                    href={file.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {title}
                                  </a>
                                ) : (
                                  <span className="text-gray-500">Not Uploaded</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
              <button
                className="w-[300px] mt-4 px-4 py-2 bg-[#003793] text-white rounded-md disabled:bg-gray-400"
                onClick={handleUpdateStatuses}
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Finalize Changes"}
              </button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}