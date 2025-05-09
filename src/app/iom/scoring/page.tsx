"use client";
import SidebarIOM from "@/app/components/layout/sidebariom";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import ScoringQuestionDialog from "./components/ScoringQuestionsDialog";
import { Toaster, toast } from "sonner";

interface Period {
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

interface Question {
  question_id: number;
  question: string;
}

interface ScoreMatrixEntry {
  student_id: number;
  period_id: number;
  question_id: number;
  score_category: "KURANG" | "CUKUP" | "BAIK";
  comment: string;
  Question: Question;
}

export default function Scoring() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);


  const [currentStudent, setCurrentStudent] = useState<number | null>(null);
  const [scoreMatrix, setScoreMatrix] = useState<ScoreMatrixEntry[]>([]);

  const [questions, setQuestions] = useState<Question[]>([]);

  const fetchPeriods = async () => {
    try {
      const response = await fetch("/api/periods");
      if (!response.ok) {
        throw new Error("Failed to fetch periods");
      }
      const data: Period[] = await response.json();
      setPeriods(data);
      return data;
    } catch (error) {
      console.error("Error fetching periods:", error);
      return null;
    }
  };

  const fetchStudentsByPeriod = async (periodId: number) => {
    try {
      const response = await fetch("/api/files/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period_id: periodId }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
  
      const data = await response.json();
  
      if (data.success) {
        setStudents(data.data);
        return data.data;
      } else {
        console.error("Error fetching student:", data.error);
        setStudents([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
      return [];
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch("/api/questions");
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      const data = await response.json();
  
      if (data && Array.isArray(data)) {
        setQuestions(data);
        return data;
      } else {
        console.error("Unexpected question data format", data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      return [];
    }
  };

  const fetchScoreMatrix = async (student: Student) => {
    try {
      const response = await fetch(
        `/api/score-matrix?student_id=${student.student_id}&period_id=${student.period_id}`
      );
  
      if (!response.ok) {
        throw new Error("Failed to fetch score matrix");
      }
  
      const data = await response.json();
      setScoreMatrix(data);
      return data;
    } catch (error) {
      console.error("Error fetching score matrix:", error);
      return [];
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Existing code for fetching periods, students, etc.
        const fetchedPeriods = await fetchPeriods();
        if (fetchedPeriods) {
          const currentPeriod = fetchedPeriods.find((period) => period.is_current);
          setSelectedPeriod(currentPeriod || null);
          if (currentPeriod) {
            const fetchedStudents = await fetchStudentsByPeriod(currentPeriod.period_id);
            if (fetchedStudents && fetchedStudents.length > 0) {
              const defaultStudent = fetchedStudents[0];
              setCurrentStudent(defaultStudent.student_id);
              
              // Fetch questions
              const questions = await fetchQuestions();
              setQuestions(questions);
              
              // Fetch score matrix
              const defaultStudentScoreMatrix = await fetchScoreMatrix(defaultStudent);
              setScoreMatrix(defaultStudentScoreMatrix);
              
              // Fetch status to get amount
              try {
                const statusResponse = await fetch(`/api/status/${defaultStudent.student_id}/${currentPeriod.period_id}`);
                if (statusResponse.ok) {
                  const statusData = await statusResponse.json();
                  setAidAmount(statusData.amount !== null ? statusData.amount.toString() : "0");
                } else {
                  setAidAmount("0");
                }
              } catch (error) {
                console.error("Error fetching status:", error);
                setAidAmount("0");
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading page data:", error);
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = students.filter(
      (student) =>
        student.Student.User.name.toLowerCase().includes(term) ||
        student.Student.nim.toLowerCase().includes(term)
    );
    setFilteredStudents(filtered);
    setCurrentPage(1); 
  }, [searchTerm, students]);  

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
  
  // Update the handleStudentClick function to fetch the status record as well
  const handleStudentClick = async (student: Student) => {
    const studentId = student.student_id;
    setCurrentStudent(studentId);
    setLoading(true);
    
    try {
      // Fetch score matrix
      const scoreMatrixResponse = await fetchScoreMatrix(student);
      setScoreMatrix(scoreMatrixResponse);
      
      // Fetch the student's status to get the amount
      const statusResponse = await fetch(`/api/status/${studentId}/${selectedPeriod?.period_id}`);
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        // Set the amount from the status record, defaulting to "0" if it's null
        setAidAmount(statusData.amount !== null ? statusData.amount.toString() : "0");
      } else {
        // If there's an error or no status record, default to "0"
        setAidAmount("0");
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("Failed to fetch student data");
      setAidAmount("0");
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (
    question_id: number,
    field: "score_category" | "comment",
    value: string
  ) => {
    setScoreMatrix((prev) => {
      const entryIndex = prev.findIndex((sm) => sm.question_id === question_id);
  
      if (entryIndex > -1) {
        return prev.map((entry) => {
          if (entry.question_id === question_id) {
            return {
              ...entry,
              [field]: value,
              score_category:
                field === "score_category"
                  ? (value as "KURANG" | "CUKUP" | "BAIK")
                  : entry.score_category,
              comment: field === "comment" ? value : entry.comment,
            };
          }
          return entry;
        });
      } else {
        const question = questions.find((q) => q.question_id === question_id);
        if (!question || !currentStudent || !selectedPeriod) return prev;
  
        const newEntry: ScoreMatrixEntry = {
          student_id: currentStudent,
          period_id: selectedPeriod.period_id,
          question_id,
          score_category:
            field === "score_category"
              ? (value as "KURANG" | "CUKUP" | "BAIK")
              : "KURANG",
          comment: field === "comment" ? value : "",
          Question: question,
        };
  
        return [...prev, newEntry];
      }
    });
  };
  
  const [aidAmount, setAidAmount] = useState<string>("0");

  // Update the handleSubmit function to include the amount field:
  const handleSubmit = async () => {
    if (!currentStudent || !selectedPeriod) {
      alert("Pilih mahasiswa dan periode terlebih dahulu.");
      return;
    }

    try {
      // First save the score matrix
      const scoreRes = await fetch("/api/score-matrix/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scoreMatrix),
      });

      if (!scoreRes.ok) {
        const errorData = await scoreRes.json();
        throw new Error(errorData.message || "Gagal menyimpan penilaian");
      }

      // Then update the student's status including the aid amount
      const statusRes = await fetch("/api/status/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{
          student_id: currentStudent,
          period_id: selectedPeriod.period_id,
          Statuses: [{ 
            passDitmawa: true, 
            passIOM: true,
            amount: parseInt(aidAmount) || 0 
          }],
        }]),
      });

      if (!statusRes.ok) {
        throw new Error("Gagal memperbarui status mahasiswa");
      }

      toast.success("Penilaian dan jumlah bantuan berhasil disimpan!");
    } catch (error) {
      console.error("Error submitting scores:", error);
      toast.error("Terjadi kesalahan saat menyimpan penilaian.");
    }
  };

  return (
      <div className="flex min-h-screen bg-gray-100">
        <Toaster position="bottom-right" richColors />
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
                  <div className="w-full flex gap-3">
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

                    <ScoringQuestionDialog />
                  </div>

                  <div className="mt-4 w-[300px]">
                    <label htmlFor="search" className="text-sm font-medium mb-1">
                      Cari Nama/NIM Mahasiswa:
                    </label>
                    <input
                      id="search"
                      type="text"
                      placeholder="Masukkan Nama atau NIM"
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-[300px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex w-full gap-6 justify-between mt-6">
                    {selectedPeriod && (
                      <div className="flex flex-col gap-4 w-[450px]">
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
                              {currentStudents.map((student, index) => {
                                const isSelected = student.Student.User.user_id === currentStudent;

                                return (
                                  <tr
                                    key={index}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleStudentClick(student)}
                                    className={`cursor-pointer ${
                                      isSelected ? "bg-[#003793]" : "bg-white hover:bg-gray-100"
                                    }`}
                                  >
                                    <td className="px-2 py-4 text-sm text-gray-900">
                                      <div className="line-clamp-2 overflow-hidden">
                                        {isSelected ? (
                                          <span className="text-white">{student.Student.nim}</span>
                                        ) : (
                                          student.Student.nim
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-2 py-4 text-sm text-gray-900">
                                      <div className="line-clamp-2 overflow-hidden">
                                        {isSelected ? (
                                          <span className="text-white">{student.Student.User.name}</span>
                                        ) : (
                                          student.Student.User.name
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                          </table>
                        </div>
                        <div className="flex w-full justify-between items-center gap-2 mt-2">
                          <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-2 py-2 rounded border border-2 hover:bg-gray-200 text-sm disabled:opacity-50"
                          >
                            Previous
                          </button>

                          <div className="flex gap-1">
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
                                  className={`px-2 py-2 text-sm rounded ${
                                    currentPage === page
                                      ? "bg-[#003793] text-white"
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
                            className="px-2 py-2 rounded border border-2 hover:bg-gray-200 text-sm disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="w-full p-2 border border-gray-300 rounded-md">
                      {questions.length > 0 ? (
                        <>
                          <div className="flex flex-col gap-4 p-4 max-h-[550px] overflow-y-auto">
                            <h2 className="text-xl font-bold">Lembar Penilaian</h2>
                            {questions.map((q) => {
                              const entry = scoreMatrix.find((sm) => sm.question_id === q.question_id);
                              return (
                                <div key={q.question_id}>
                                  <p className="mb-2 font-medium">{q.question}</p>
                                  <div className="flex justify-between items-center mb-3">
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`question-${q.question_id}`}
                                        value="KURANG"
                                        checked={entry?.score_category === 'KURANG'}
                                        onChange={() => handleScoreChange(q.question_id, "score_category", "KURANG")}
                                        className="mr-2"
                                      />
                                      <span>Kurang</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`question-${q.question_id}`}
                                        value="CUKUP"
                                        checked={entry?.score_category === 'CUKUP'}
                                        onChange={() => handleScoreChange(q.question_id, "score_category", "CUKUP")}
                                        className="mr-2"
                                      />
                                      <span>Cukup</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`question-${q.question_id}`}
                                        value="BAIK"
                                        checked={entry?.score_category === 'BAIK'}
                                        onChange={() => handleScoreChange(q.question_id, "score_category", "BAIK")}
                                        className="mr-2"
                                      />
                                      <span>Baik</span>
                                    </label>
                                  </div>
                                  <div>
                                    <label htmlFor={`comment-${q.question_id}`} className="block text-sm font-medium mb-1">
                                      Keterangan
                                    </label>
                                    <textarea
                                      id={`comment-${q.question_id}`}
                                      rows={2}
                                      defaultValue={entry?.comment || ''}
                                      onChange={(e) => handleScoreChange(q.question_id, "comment", e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                      placeholder="Masukkan keterangan..."
                                    ></textarea>
                                  </div>
                                  <hr className="mt-4" />
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-4 border-t pt-4">
                            <h3 className="text-lg font-semibold mb-2">Jumlah Bantuan</h3>
                            <div className="flex items-center">
                              <span className="mr-2 font-medium">Rp</span>
                              <input
                                type="number"
                                value={aidAmount}
                                onChange={(e) => setAidAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="Masukkan jumlah bantuan (0 jika tidak ada)"
                              />
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Masukkan 0 jika mahasiswa tidak menerima bantuan.
                            </p>
                          </div>
                          <div className="mt-6 flex justify-end">
                            <button
                              onClick={handleSubmit}
                              className="px-4 py-2 bg-[#003793] text-white rounded-md hover:bg-blue-700 focus:outline-none"
                            >
                              Simpan Penilaian
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-center mt-2">Mohon tambahkan pertanyaan penilaian terlebih dahulu.</p>
                        </>
                      )}
                    </div>
                  </div>
                </>
            )}
          </Card>
        </div>
      </div>
  )
}