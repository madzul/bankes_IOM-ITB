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
      const response = await fetch(`/api/student/scoring?period_id=${ periodId }`);
  
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
      fetchStudentsByPeriod(Number(selected?.period_id));
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
      <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        <Toaster position="bottom-right" richColors />
        
        {/* Sidebar */}
        <div className="w-1/4 m-8">
          <SidebarIOM activeTab="scoring" />
        </div>
        
        {/* Main Content */}
        <div className="my-8 mr-8 w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Penilaian Mahasiswa
            </h1>
            <p className="text-slate-600 text-lg">
              Kelola dan berikan penilaian untuk mahasiswa berdasarkan periode yang dipilih
            </p>
          </div>
          
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
            <div className="p-8">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-lg font-medium text-slate-600">Memuat data...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Controls Section */}
                  <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Periode Akademik
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-700 font-medium"
                        value={selectedPeriod?.period_id || ""}
                        onChange={handlePeriodChange}
                      >
                        <option value="">Pilih Periode</option>
                        {periods.map((period) => (
                          <option key={period.period_id} value={period.period_id}>
                            {period.period} {period.is_current ? "(Aktif)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <ScoringQuestionDialog />
                    </div>
                  </div>

                  {/* Search Section */}
                  <div className="mb-8">
                    <label htmlFor="search" className="block text-sm font-semibold text-slate-700 mb-2">
                      Cari Mahasiswa
                    </label>
                    <div className="relative">
                      <input
                        id="search"
                        type="text"
                        placeholder="Masukkan nama atau NIM mahasiswa..."
                        className="w-full max-w-md px-4 py-3 pl-11 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid lg:grid-cols-5 gap-8">
                    {/* Student List */}
                    {selectedPeriod && (
                      <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Daftar Mahasiswa</h3>
                        
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                                    NIM
                                  </th>
                                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Nama
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {currentStudents.map((student, index) => {
                                  const isSelected = student.Student.User.user_id === currentStudent;

                                  return (
                                    <tr
                                      key={index}
                                      role="button"
                                      tabIndex={0}
                                      onClick={() => handleStudentClick(student)}
                                      className={`cursor-pointer transition-all duration-200 ${
                                        isSelected 
                                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md" 
                                          : "hover:bg-slate-50"
                                      }`}
                                    >
                                      <td className="px-4 py-4 text-sm font-medium">
                                        <div className="truncate">
                                          {student.Student.nim}
                                        </div>
                                      </td>
                                      <td className="px-4 py-4 text-sm">
                                        <div className="truncate">
                                          {student.Student.User.name}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        
                        {/* Pagination */}
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                          </button>

                          <div className="flex space-x-1">
                            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                              let startPage = Math.max(1, currentPage - 1);
                              if (currentPage === totalPages) startPage = Math.max(1, totalPages - 2);
                              if (currentPage === 1) startPage = 1;

                              const page = startPage + i;
                              if (page > totalPages) return null;

                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                    currentPage === page
                                      ? "bg-blue-600 text-white shadow-md"
                                      : "text-slate-600 hover:bg-slate-100"
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
                            className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            Next
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Scoring Form */}
                    <div className="lg:col-span-3">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        {questions.length > 0 ? (
                          <>
                            {/* Form Header */}
                            <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Lembar Penilaian
                              </h2>
                            </div>
                            
                            {/* Questions Form */}
                            <div className="p-6 max-h-[600px] overflow-y-auto">
                              <div className="space-y-8">
                                {questions.map((q, questionIndex) => {
                                  const entry = scoreMatrix.find((sm) => sm.question_id === q.question_id);
                                  return (
                                    <div key={q.question_id} className="group">
                                      <div className="mb-4">
                                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 text-sm font-bold rounded-full mr-3">
                                          {questionIndex + 1}
                                        </span>
                                        <span className="text-base font-semibold text-slate-800">{q.question}</span>
                                      </div>
                                      
                                      {/* Rating Options */}
                                      <div className="grid grid-cols-3 gap-4 mb-4">
                                        {[
                                          { value: "KURANG", label: "Kurang", color: "red" },
                                          { value: "CUKUP", label: "Cukup", color: "yellow" },
                                          { value: "BAIK", label: "Baik", color: "green" }
                                        ].map((option) => (
                                          <label 
                                            key={option.value}
                                            className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                              entry?.score_category === option.value
                                                ? `border-${option.color}-500 bg-${option.color}-50 shadow-md`
                                                : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                                            }`}
                                          >
                                            <input
                                              type="radio"
                                              name={`question-${q.question_id}`}
                                              value={option.value}
                                              checked={entry?.score_category === option.value}
                                              onChange={() => handleScoreChange(q.question_id, "score_category", option.value)}
                                              className={`w-4 h-4 mr-3 text-${option.color}-600 focus:ring-${option.color}-500`}
                                            />
                                            <span className={`font-medium ${
                                              entry?.score_category === option.value 
                                                ? `text-${option.color}-700` 
                                                : "text-slate-700"
                                            }`}>
                                              {option.label}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                      
                                      {/* Comment Field */}
                                      <div>
                                        <label htmlFor={`comment-${q.question_id}`} className="block text-sm font-semibold text-slate-700 mb-2">
                                          Keterangan
                                        </label>
                                        <textarea
                                          id={`comment-${q.question_id}`}
                                          rows={3}
                                          defaultValue={entry?.comment || ''}
                                          onChange={(e) => handleScoreChange(q.question_id, "comment", e.target.value)}
                                          className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                          placeholder="Berikan keterangan atau catatan tambahan..."
                                        />
                                      </div>
                                      
                                      {questionIndex < questions.length - 1 && (
                                        <div className="mt-6 border-b border-slate-200"></div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Aid Amount Section */}
                            <div className="px-6 py-5 border-t border-slate-200 bg-slate-50">
                              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                Jumlah Bantuan
                              </h3>
                              <div className="flex items-center space-x-3">
                                <span className="text-lg font-semibold text-slate-700 bg-white px-3 py-2 rounded-lg">Rp</span>
                                <input
                                  type="number"
                                  value={aidAmount}
                                  onChange={(e) => setAidAmount(e.target.value)}
                                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg font-medium"
                                  placeholder="0"
                                />
                              </div>
                              <p className="text-sm text-slate-500 mt-2 bg-blue-50 px-3 py-2 rounded-lg">
                                💡 Masukkan 0 jika mahasiswa tidak menerima bantuan
                              </p>
                            </div>
                            
                            {/* Submit Button */}
                            <div className="px-6 py-5 border-t border-slate-200">
                              <button
                                onClick={handleSubmit}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Simpan Penilaian</span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="p-12 text-center">
                            <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-800 mb-2">Belum Ada Pertanyaan</h3>
                            <p className="text-slate-600 mb-6">Mohon tambahkan pertanyaan penilaian terlebih dahulu untuk memulai proses evaluasi.</p>
                            <ScoringQuestionDialog />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
  )
}