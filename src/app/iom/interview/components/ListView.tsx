"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PlusCircle, Calendar, Clock, Users, Edit, Trash, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

// Types
interface IOMStaff {
  user_id: number;
  name: string;
  email: string;
}

interface InterviewParticipant {
  id: number;
  user_id: number;
  User: {
    name: string;
  };
}

interface InterviewSlot {
  id: number;
  slot_number: number;
  start_time: string;
  end_time: string;
  student_id: number | null;
  Student?: {
    User: {
      name: string;
    };
  };
}

interface Interview {
  interview_id: number;
  title: string | null;
  description: string | null;
  start_time: string;
  end_time: string;
  max_students: number;
  user_id: number;
  User: {
    name: string;
    email: string;
  };
  participants: InterviewParticipant[];
  slots: InterviewSlot[];
}

type InterviewFormData = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  maxStudents: number;
  participants: number[];
};

export default function ListView() {
  const { data: session } = useSession();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [iomStaff, setIomStaff] = useState<IOMStaff[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState<number | null>(null);
  const [filter, setFilter] = useState("upcoming");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<InterviewFormData>({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    maxStudents: 1,
    participants: [],
  });

  // Fetch interviews and IOM staff
  useEffect(() => {
    fetchInterviews();
    fetchIOMStaff();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await fetch("/api/interviews");
      if (response.ok) {
        const data = await response.json();
        setInterviews(data.data);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
      toast.error("Failed to load interviews");
    }
  };

  const fetchIOMStaff = async () => {
    try {
      const response = await fetch("/api/iom-staff");
      if (response.ok) {
        const data = await response.json();
        setIomStaff(data.data);
      }
    } catch (error) {
      console.error("Error fetching IOM staff:", error);
    }
  };

  const handleCreateOrUpdateInterview = async () => {
    setIsLoading(true);
    try {
      // Format start and end times
      const { date, startTime, endTime, maxStudents, participants, title, description } = formData;
      
      const combinedStartTime = `${date}T${startTime}:00`;
      const combinedEndTime = `${date}T${endTime}:00`;
      
      const endpoint = editingInterviewId 
        ? `/api/interviews/${editingInterviewId}` 
        : "/api/interviews";
      
      const method = editingInterviewId ? "PUT" : "POST";
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          start_time: combinedStartTime,
          end_time: combinedEndTime,
          max_students: maxStudents,
          participantIds: participants,
        }),
      });

      if (response.ok) {
        toast.success(editingInterviewId ? "Interview updated successfully" : "Interview created successfully");
        fetchInterviews();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save interview");
      }
    } catch (error) {
      console.error("Error saving interview:", error);
      toast.error("Failed to save interview");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInterview = async (interviewId: number) => {
    if (confirm("Are you sure you want to delete this interview session?")) {
      try {
        const response = await fetch(`/api/interviews/${interviewId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Interview deleted successfully");
          fetchInterviews();
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to delete interview");
        }
      } catch (error) {
        console.error("Error deleting interview:", error);
        toast.error("Failed to delete interview");
      }
    }
  };

  const handleCancelBooking = async (slotId: number) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      try {
        const response = await fetch(`/api/interviews/slots/${slotId}/cancel`, {
          method: "POST",
        });

        if (response.ok) {
          toast.success("Booking cancelled successfully");
          fetchInterviews();
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to cancel booking");
        }
      } catch (error) {
        console.error("Error cancelling booking:", error);
        toast.error("Failed to cancel booking");
      }
    }
  };

  const handleEditInterview = (interview: Interview) => {
    const startDateTime = new Date(interview.start_time);
    const endDateTime = new Date(interview.end_time);
    
    setFormData({
      title: interview.title || "",
      description: interview.description || "",
      date: format(startDateTime, "yyyy-MM-dd"),
      startTime: format(startDateTime, "HH:mm"),
      endTime: format(endDateTime, "HH:mm"),
      maxStudents: interview.max_students,
      participants: interview.participants.map(p => p.user_id),
    });
    
    setEditingInterviewId(interview.interview_id);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      maxStudents: 1,
      participants: [],
    });
    setEditingInterviewId(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const toggleParticipant = (userId: number) => {
    setFormData(prev => {
      if (prev.participants.includes(userId)) {
        return {
          ...prev,
          participants: prev.participants.filter(id => id !== userId)
        };
      } else {
        return {
          ...prev,
          participants: [...prev.participants, userId]
        };
      }
    });
  };

  // Filter interviews
  const filteredInterviews = interviews.filter(interview => {
    const interviewDate = new Date(interview.start_time);
    const today = new Date();
    
    if (filter === "upcoming") {
      return interviewDate >= today;
    } else if (filter === "past") {
      return interviewDate < today;
    } else if (filter === "date" && selectedDate) {
      return format(interviewDate, "yyyy-MM-dd") === selectedDate;
    }
    return true;
  });

  return (
    <>
      <div className="mb-6 flex items-center space-x-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter interviews" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Wawancara</SelectItem>
            <SelectItem value="upcoming">Wawancara Mendatang</SelectItem>
            <SelectItem value="past">Wawancara Sebelumnya</SelectItem>
            <SelectItem value="date">Filter Berdasarkan Tanggal</SelectItem>
          </SelectContent>
        </Select>

        {filter === "date" && (
          <Input
            type="date"
            value={selectedDate || ""}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[180px]"
          />
        )}
        
        <div className="ml-auto">
          <Button onClick={handleOpenDialog} className="bg-var hover:bg-var/90">
            <PlusCircle className="h-4 w-4 mr-2" />
            Buat Jadwal Baru
          </Button>
        </div>
      </div>

      {filteredInterviews.length === 0 ? (
        <Card className="p-8 w-full text-center">
          <p className="text-gray-500">Tidak ada jadwal wawancara yang ditemukan.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredInterviews.map((interview) => (
            <Card key={interview.interview_id} className="p-6 w-full shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{interview.title || "Sesi Wawancara"}</h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      {format(new Date(interview.start_time), "EEEE, d MMMM yyyy", { locale: id })}
                    </p>
                    <p className="text-sm flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      {format(new Date(interview.start_time), "HH:mm")} - {format(new Date(interview.end_time), "HH:mm")}
                    </p>
                    <p className="text-sm flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-500" />
                      Pengurus IOM: {interview.User.name}
                      {interview.participants.length > 0 && (
                        <span>, {interview.participants.map(p => p.User.name).join(", ")}</span>
                      )}
                    </p>
                    {interview.description && (
                      <p className="text-sm mt-2 text-gray-600">{interview.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditInterview(interview)}
                    className="border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-200 hover:border-red-300 hover:bg-red-50"
                    onClick={() => handleDeleteInterview(interview.interview_id)}
                  >
                    <Trash className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-md font-semibold mb-2 text-gray-700">Daftar Slot</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {interview.slots.map((slot) => (
                    <div 
                      key={slot.id} 
                      className={`p-3 rounded-md flex justify-between items-center ${
                        slot.student_id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div>
                        <p className="font-medium">Slot {slot.slot_number}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(slot.start_time), "HH:mm")} - {format(new Date(slot.end_time), "HH:mm")}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {slot.student_id ? (
                          <>
                            <div className="flex items-center mr-4">
                              <User className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="font-medium">{slot.Student?.User?.name || "Mahasiswa"}</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-500 border-red-200 hover:border-red-300 hover:bg-red-50"
                              onClick={() => handleCancelBooking(slot.id)}
                            >
                              Batalkan
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">Slot kosong</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Interview Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingInterviewId ? "Edit Jadwal Wawancara" : "Buat Jadwal Wawancara Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Judul Sesi Wawancara"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi tambahan mengenai sesi wawancara"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStudents">Jumlah Mahasiswa</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Waktu Mulai</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Waktu Selesai</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Pengurus IOM Tambahan</Label>
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                {iomStaff
                  .filter(staff => staff.user_id !== parseInt(session?.user?.id as string))
                  .map((staff) => (
                    <div key={staff.user_id} className="flex items-center space-x-2 py-2">
                      <Checkbox 
                        id={`staff-${staff.user_id}`} 
                        checked={formData.participants.includes(staff.user_id)}
                        onCheckedChange={() => toggleParticipant(staff.user_id)} 
                      />
                      <label 
                        htmlFor={`staff-${staff.user_id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {staff.name}
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button 
              onClick={handleCreateOrUpdateInterview} 
              disabled={isLoading || !formData.date || !formData.startTime || !formData.endTime}
              className="bg-var hover:bg-var/90"
            >
              {isLoading ? "Memproses..." : editingInterviewId ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}