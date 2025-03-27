"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import SidebarIOM from "@/app/components/layout/sidebariom";
import { Toaster, toast } from "sonner";

// import { useSession } from "next-auth/react";

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
  nim: string;
  User: {
    user_id: number;
    name: string;
  };
  Files: File[];
  Statuses: Status[];
}

const fileTypes = [
  { title: "KTP", key: "KTP" },
  { title: "CV", key: "CV" },
  { title: "Transkrip Nilai", key: "Transkrip_Nilai" },
];

export default function Upload() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [editedStudents, setEditedStudents] = useState<{ [student_id: number]: Partial<Status> }>({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchPeriods() {
      try {
        const response = await fetch('/api/periods');
        if (!response.ok) {
          throw new Error('Failed to fetch periods');
        }
        const data: Period[] = await response.json();
        setPeriods(data);
        const currentPeriod = data.find((period: Period) => period.is_current);
        setSelectedPeriod(currentPeriod || null);
      } catch (error) {
        console.error(error);
      }
    }

    fetchPeriods();
  }, []);

  useEffect(() => {
    async function fetchStudentFiles(periodId: number) {
      try {
        const response = await fetch('/api/files/fetch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ period_id: periodId }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch student files');
        }

        const data = await response.json();
        if (data.success) {
          setStudents(data.data);
          // Reset editedStudents when a new period is selected
          setEditedStudents({});
        } else {
          console.error('Error fetching student files:', data.error);
        }
      } catch (error) {
        console.error('Error fetching student files:', error);
      }
    }

    if (selectedPeriod?.period_id) {
      fetchStudentFiles(selectedPeriod.period_id);
    } else {
      setStudents([]);
    }
  }, [selectedPeriod?.period_id]);

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    const selected = periods.find((period) => period.period_id === parseInt(selectedId, 10));
    setSelectedPeriod(selected || null);
  };

  const handleCheckboxChange = (
    student_id: number,
    field: keyof Status,
    value: boolean
  ) => {
    setEditedStudents((prev) => ({
      ...prev,
      [student_id]: {
        ...prev[student_id],
        [field]: value,
      },
    }));
  };

  const handleFinalize = async () => {
    setIsUpdating(true);

    try {
      const response = await fetch('/api/files/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period_id: selectedPeriod?.period_id }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch latest student data');
      }

      const latestData = await response.json();

      if (latestData.success) {
        const updatedStudents = latestData.data.map((student: Student) => {
          const editedStatus = editedStudents[student.student_id];
          if (editedStatus) {
            return {
              ...student,
              Statuses: [
                {
                  ...student.Statuses[0],
                  ...editedStatus,
                },
              ],
              ...selectedPeriod,
            };
          }
          return student;
        });

        const updateResponse = await fetch('/api/status/update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedStudents),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update student statuses');
        }

        setStudents(updatedStudents);
        setEditedStudents({});

        toast.success("Status updated successfully");
      } else {
        toast.error("Error fetching latest student data.")
        // console.error('Error fetching latest student data:', latestData.error);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Error finalizing updates.");
      // console.error('Error finalizing updates:', error);
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
          <select
            className="block w-[300px] px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={selectedPeriod?.period_id || ''}
            onChange={handlePeriodChange}
          >
            <option value="">None</option>
            {periods.map((period) => (
              <option key={period.period_id} value={period.period_id}>
                {period.period} {period.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>

          {selectedPeriod && (
            <div className="mt-6 max-w-full overflow-x-auto border border-gray-300 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium min-w-52 uppercase tracking-wider">
                      NIM
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium min-w-52 uppercase tracking-wider">
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium min-w-52 uppercase tracking-wider">
                      Lolos Seleksi Berkas Ditmawa?
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium min-w-52 uppercase tracking-wider">
                      Lolos Seleksi Berkas IOM?
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.student_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.nim}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.User.name}</td>
                      {fileTypes.map(({ key, title }) => {
                        const file = student.Files.find((f) => f.type === key);
                        return (
                          <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                          checked={
                            editedStudents[student.student_id]?.passDitmawa ??
                            (student.Statuses[0]?.passDitmawa ?? false)
                          }
                          onChange={(e) =>
                            handleCheckboxChange(
                              student.student_id,
                              'passDitmawa',
                              e.target.checked
                            )
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <input
                          type="checkbox"
                          checked={
                            editedStudents[student.student_id]?.passIOM ??
                            (student.Statuses[0]?.passIOM ?? false)
                          }
                          onChange={(e) =>
                            handleCheckboxChange(student.student_id, 'passIOM', e.target.checked)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <button
            className="w-[300px] mt-4 px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-400"
            onClick={handleFinalize}
            disabled={Object.keys(editedStudents).length === 0 || isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Finalize Changes'}
          </button>
        </Card>
      </div>
    </div>
  );
}