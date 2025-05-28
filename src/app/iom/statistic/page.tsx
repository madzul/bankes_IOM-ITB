"use client"

import { Card } from "@/components/ui/card"
import SidebarIOM from "@/app/components/layout/sidebariom"
import { useEffect, useState } from "react";
import { Period, Student } from "../document/page";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Bar,
  BarChart,
} from 'recharts';

interface TotalStudentsAllPeriod {
  period: string;
  student_count: number;
};

interface TotalStudentsPerPeriod {
  faculty: string;
  student_count: number;
}

export default function Upload() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const [totalStudentsAllPeriod, setTotalStudentsAllPeriod] = useState<TotalStudentsAllPeriod[]>([]);
  const [totalStudentsPerPeriod, settotalStudentsPerPeriod] = useState<TotalStudentsPerPeriod[] | null>(null);

  useEffect(() => {
    async function fetchPeriodsAndStudentFiles() {
      try {
        setLoading(true);
        const periodResponse = await fetch("/api/periods");
        if (!periodResponse.ok) throw new Error("Failed to fetch periods");
        const periodsData: Period[] = await periodResponse.json();
        setPeriods(periodsData);

        const currentPeriod = periodsData.find((period) => period.is_current);
        setSelectedPeriod(currentPeriod || null);

        if (!currentPeriod?.period_id) {
          setStudents([]);
          return;
        }

        const fileResponse = await fetch("/api/files/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period_id: currentPeriod.period_id }),
        });
        if (!fileResponse.ok) throw new Error("Failed to fetch student files");
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

    async function fetchTotalStudentsAllPeriod() {
      try {
        const res = await fetch("/api/statistic/total-students-all-period");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTotalStudentsAllPeriod(json.data);
        } else {
          setTotalStudentsAllPeriod([]);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        setTotalStudentsAllPeriod([]);
      }
    }

    fetchPeriodsAndStudentFiles();
    fetchTotalStudentsAllPeriod();
  }, []);

  useEffect(() => {
    async function fetchTotalStudentsPerPeriod(periodId: number) {
      setLoading(true);
      try {
        const res = await fetch(`/api/statistic/total-students-per-period?selectedPeriod=${periodId}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          settotalStudentsPerPeriod(json.data);
        } else {
          settotalStudentsPerPeriod([]);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        settotalStudentsPerPeriod([]);
      } finally {
        setLoading(false);
      }
    }

    if (selectedPeriod?.period_id) {
      fetchTotalStudentsPerPeriod(selectedPeriod.period_id);
    } else {
      settotalStudentsPerPeriod([]);
    }
  }, [selectedPeriod]);


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
        <SidebarIOM activeTab="statistic"/>
      </div>

      {/* Main Content */}
      <div className="my-8 mr-8 w-full">
        <h1 className="text-2xl font-bold mb-6">Statistik</h1>

        <Card className="p-8 w-full">
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

              <h2 className="font-bold">Persebaran Mahasiswa Seluruh Periode</h2>
              {totalStudentsAllPeriod? (
                <div className="w-full h-[400px] mt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={totalStudentsAllPeriod}>
                      <CartesianGrid stroke="#e0e0e0" strokeDasharray="5 5" />
                      <XAxis dataKey="period" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="student_count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p>No data available.</p>
              )}
            </>
          )}

          {selectedPeriod &&
            <>
              <h2 className="font-bold">Persebaran Mahasiswa Periode {selectedPeriod?.period}</h2>
              {totalStudentsPerPeriod? (
                <div className="w-full h-[400px] mt-8">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={totalStudentsPerPeriod} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="faculty" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="student_count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p>No data available.</p>
              )}
            </>
          }
        </Card>
      </div>
    </div>
  )
}