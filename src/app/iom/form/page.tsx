"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import SidebarIOM from "@/app/components/layout/sidebariom";
import InterviewFormDialog from "./components/InterviewFormDialog";

export interface Period {
  period_id: number;
  period: string;
  start_date: Date;
  end_date: Date;
  is_current: boolean;
}

interface Student {
  nim : string;
  userName : string;
  text : string;
}

export default function Form() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPeriodsAndFormInterview() {
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

        const fileResponse = await fetch("/api/form", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ period_id: currentPeriod.period_id }),
        });
        if (!fileResponse.ok) {
          throw new Error("Failed to fetch form interview");
        }
        const fileData = await fileResponse.json();
        console.log(fileData,);
        if (fileData.success) {
          setStudents(fileData.data);
        } else {
          console.error("Error fetching form interview :", fileData.error);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPeriodsAndFormInterview();
  }, []);

  const handlePeriodChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      // setLoading(true);
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
      // setLoading(false);
    }
  };

  const handleSaveForm = async (nim: string, updatedData: string) => {
    try {
      const response = await fetch("/api/form/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ periods, nim, formData: updatedData }),
      })

      if (!response.ok) {
        throw new Error("Failed to save form data")
      }

      const result = await response.json()

      if (result.success) {
        // Update the local state with the new data
        setStudents((prevStudents) =>
          prevStudents.map((student) => (student.nim === nim ? { ...student, text: updatedData } : student)),
        )

        alert("Form data saved successfully")
      } else {
        throw new Error(result.error || "Failed to save form data")
      }
    } catch (error) {
      console.error("Error saving form data:", error)
      alert("Failed to save form data. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-1/4 m-8">
        <SidebarIOM activeTab="form" />
      </div>
      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Form Interview</h1>
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
              {selectedPeriod && (
                <div className="mt-6 max-w-full overflow-x-auto border border-gray-300 rounded-md">
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
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium min-w-52 uppercase tracking-wider"
                        >
                          Form Interview
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.nim}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.nim}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.userName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <InterviewFormDialog
                              studentName={student.userName}
                              nim={student.nim}
                              formData={student.text}
                              onSave={handleSaveForm}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}