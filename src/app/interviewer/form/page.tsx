"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { Card } from "@/components/ui/card"
import SidebarIOM from "@/app/components/layout/sidebariom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner";
import SidebarInterviewer from "@/app/components/layout/sidebarinterviewer"

export interface Period {
  period_id: number
  period: string
  start_date: Date
  end_date: Date
  is_current: boolean
}

interface Student {
  nim: string
  userName: string
  text: string
}

interface FormField {
  label: string
  type: string
  value: string
  key: string
}

export default function Form() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchPeriodsAndFormInterview() {
      try {
        setLoading(true)
        const periodResponse = await fetch("/api/periods")
        if (!periodResponse.ok) {
          throw new Error("Failed to fetch periods")
        }
        const periodsData: Period[] = await periodResponse.json()
        setPeriods(periodsData)
        const currentPeriod = periodsData.find((period: Period) => period.is_current)
        setSelectedPeriod(currentPeriod || null)
        if (!currentPeriod?.period_id) {
          setStudents([])
          return
        }

        const fileResponse = await fetch("/api/form", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ period_id: currentPeriod.period_id }),
        })
        if (!fileResponse.ok) {
          throw new Error("Failed to fetch form interview")
        }
        const fileData = await fileResponse.json()
        if (fileData.success) {
          setStudents(fileData.data)
        } else {
          console.error("Error fetching form interview :", fileData.error)
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPeriodsAndFormInterview()
  }, [])

  const handlePeriodChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      setLoading(true)
      const selectedId = event.target.value
      const selected = periods.find((period) => period.period_id === Number.parseInt(selectedId, 10))
      setSelectedPeriod(selected || null)
      setSelectedStudent(null)
      setFormFields([])

      if (selected) {
        const fileResponse = await fetch("/api/form", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ period_id: selected?.period_id }),
        })
        if (!fileResponse.ok) {
          throw new Error("Failed to fetch student files")
        }
        const fileData = await fileResponse.json()
        if (fileData.success) {
          setStudents(fileData.data)
        } else {
          console.error("Error fetching student files:", fileData.error)
        }
      } else {
        setStudents([])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)

    try {
      // Parse the JSON string from the text field
      const formData = JSON.parse(student.text)

      // Convert the parsed JSON into an array of form fields
      const fields: FormField[] = Object.entries(formData).map(([key, value]) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
        type: typeof value === "string" && value.length > 50 ? "textarea" : "text",
        value: String(value),
      }))

      setFormFields(fields)
    } catch (error) {
      console.error("Error parsing form data:", error);
      setFormFields([]);
      toast.error("Could not parse the form data for this student");
    }
  }

  const handleFormChange = (index: number, value: string) => {
    const updatedFields = [...formFields]
    updatedFields[index].value = value
    setFormFields(updatedFields)
  }

  const handleSaveForm = async () => {
    if (!selectedStudent) return

    try {
      setIsSaving(true)

      // Convert form fields back to an object
      const formData = formFields.reduce(
        (obj, field) => {
          obj[field.key] = field.value
          return obj
        },
        {} as Record<string, string>,
      )

      // Create updated student object
      const updatedStudent = {
        ...selectedStudent,
        text: JSON.stringify(formData),
      }

      // Send to API
      console.log("selectedPeriod : ",selectedPeriod?.period_id);
      const response = await fetch("/api/form/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          period_id: selectedPeriod?.period_id,
          nim: selectedStudent.nim,
          formData: formData,
        }),
      })

      if (response.ok) {
        // Update the student in the local state
        const updatedStudents = students.map((student) =>
          student.nim === selectedStudent.nim ? updatedStudent : student,
        )
        setStudents(updatedStudents);
        setSelectedStudent(updatedStudent);
        toast.success("Form data saved successfully")
      } else {
        throw new Error("Failed to save form data")
      }
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error("Failed to save form data");
    } finally {
      setIsSaving(false)
    }
  }
  
  const filteredStudents = students.filter(
    (student) =>
      student.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.userName.toLowerCase().includes(searchTerm.toLowerCase())
  )  

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-1/4 m-8">
        <SidebarInterviewer activeTab="form" />
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
                  }}
                />
              </div>

              {selectedPeriod && (
                <div className="max-w-full flex overflow-x-auto">
                  <div className="border border-gray-300 rounded-md overflow-x-auto w-1/3">
                    <table className="w-full divide-y divide-gray-200">
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
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.map((student) => (
                          <tr
                            key={student.nim}
                            onClick={() => handleStudentSelect(student)}
                            className={`cursor-pointer hover:bg-gray-50 ${selectedStudent?.nim === student.nim ? "bg-blue-50" : ""}`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.nim}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.userName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="w-2/3 p-4 ml-4 border border-gray-300 rounded-md">
                    {selectedStudent ? (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-xl font-semibold">
                            {selectedStudent.userName} ({selectedStudent.nim})
                          </h2>
                          <Button onClick={handleSaveForm} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {formFields.map((field, index) => (
                            <div key={field.key} className="space-y-2">
                              <Label htmlFor={field.key}>{field.label}</Label>
                              {field.type === "textarea" ? (
                                <Textarea
                                  id={field.key}
                                  value={field.value}
                                  onChange={(e) => handleFormChange(index, e.target.value)}
                                  rows={4}
                                />
                              ) : (
                                <Input
                                  id={field.key}
                                  type="text"
                                  value={field.value}
                                  onChange={(e) => handleFormChange(index, e.target.value)}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Select a student to view and edit their form
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
