"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface FormField {
  label: string
  type: string
  value: string
  key: string
}

interface InterviewFormDialogProps {
  studentName: string
  nim: string
  formData: string // Stringified JSON
  onSave: (nim: string, updatedData: string) => Promise<void>
}

export default function InterviewFormDialog({ studentName, nim, formData, onSave }: InterviewFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [fields, setFields] = useState<FormField[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Parse the JSON data when opening the dialog
  const handleOpenDialog = () => {
    try {
      const parsedData = JSON.parse(formData)

      // Convert the parsed JSON into form fields
      const formFields: FormField[] = Object.entries(parsedData).map(([key, value]) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
        type: typeof value === "string" && value.length > 100 ? "textarea" : "text",
        value: String(value),
      }))

      setFields(formFields)
      setOpen(true)
    } catch (error) {
      console.error("Error parsing form data:", error)
      alert("Failed to load form data. Please try again.")
    }
  }

  // Update field value when user types
  const handleFieldChange = (index: number, value: string) => {
    const updatedFields = [...fields]
    updatedFields[index].value = value
    setFields(updatedFields)
  }

  // Save the updated form data
  const handleSave = async () => {
    try {
      setIsLoading(true)

      // Convert fields back to JSON object
      const updatedData = fields.reduce(
        (obj, field) => {
          obj[field.key] = field.value
          return obj
        },
        {} as Record<string, string>,
      )

      // Convert to JSON string
      const jsonData = JSON.stringify(updatedData)

      // Call the save function passed from parent
      await onSave(nim, jsonData)

      setOpen(false)
    } catch (error) {
      console.error("Error saving form data:", error)
      alert("Failed to save form data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handleOpenDialog}>
        View/Edit Form
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Interview Form: {studentName} ({nim})
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {fields.map((field, index) => (
              <div key={field.key} className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor={field.key} className="text-right pt-2">
                  {field.label}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    value={field.value}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                    className="col-span-3"
                    rows={4}
                  />
                ) : (
                  <Input
                    id={field.key}
                    value={field.value}
                    onChange={(e) => handleFieldChange(index, e.target.value)}
                    className="col-span-3"
                  />
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
