"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { PlusCircle, Calendar, Clock, Users, Edit, Trash, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, isWithinInterval } from "date-fns";
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

export default function WeeklyCalendarView() {
  const { data: session } = useSession();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [iomStaff, setIomStaff] = useState<IOMStaff[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState<number | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<InterviewFormData>({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    maxStudents: 1,
    participants: [],
  });

  // Calculate week days
  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: currentWeekStart,
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    });
  }, [currentWeekStart]);

  // Format the date range for display
  const dateRangeText = useMemo(() => {
    const startFormat = format(weekDays[0], "d MMMM", { locale: id });
    const endFormat = format(weekDays[weekDays.length - 1], "d MMMM yyyy", { locale: id });
    return `${startFormat} - ${endFormat}`;
  }, [weekDays]);

  // Generate time slots for the day (8:00 AM to 5:00 PM with 1-hour intervals)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // Fetch interviews and IOM staff
  useEffect(() => {
    fetchInterviews();
    fetchIOMStaff();
  }, []);

  // Set current user as default selected staff
  useEffect(() => {
    if (session?.user?.id) {
      setSelectedStaffId(session.user.id as string);
    }
  }, [session]);

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
          setIsDetailsDialogOpen(false);
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
    setIsDetailsDialogOpen(false);
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

  const nextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const prevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Filter interviews by selected staff and current week
  const filteredInterviews = useMemo(() => {
    return interviews.filter(interview => {
      const interviewStart = new Date(interview.start_time);
      const interviewEnd = new Date(interview.end_time);
      
      // Check if interview is within the current week
      const isInCurrentWeek = isWithinInterval(interviewStart, {
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
      });
      
      // Check if interview belongs to selected staff or if they're a participant
      const isOwnedBySelectedStaff = interview.user_id === parseInt(selectedStaffId || '0');
      const isParticipant = interview.participants.some(p => p.user_id === parseInt(selectedStaffId || '0'));
      
      return isInCurrentWeek && (isOwnedBySelectedStaff || isParticipant);
    });
  }, [interviews, selectedStaffId, currentWeekStart]);

  // Organize interviews by day and time
  const interviewsByDay = useMemo(() => {
    const result = new Map<string, Map<string, Interview[]>>();
    
    // Initialize maps for each day and time slot
    weekDays.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      result.set(dayStr, new Map<string, Interview[]>());
      
      timeSlots.forEach(timeSlot => {
        result.get(dayStr)?.set(timeSlot, []);
      });
    });
    
    // Place interviews in appropriate day and time slot
    filteredInterviews.forEach(interview => {
      const startDate = new Date(interview.start_time);
      const dayStr = format(startDate, 'yyyy-MM-dd');
      const hourStr = format(startDate, 'HH:00');
      
      if (result.has(dayStr) && result.get(dayStr)?.has(hourStr)) {
        result.get(dayStr)?.get(hourStr)?.push(interview);
      }
    });
    
    return result;
  }, [filteredInterviews, weekDays, timeSlots]);

  const showInterviewDetails = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsDetailsDialogOpen(true);
  };

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={prevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">{dateRangeText}</span>
            <Button variant="outline" size="sm" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
              Minggu Ini
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <Select 
              value={selectedStaffId || ''} 
              onValueChange={setSelectedStaffId}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Pilih Pengurus IOM" />
              </SelectTrigger>
              <SelectContent>
                {session?.user?.id && (
                  <SelectItem value={session.user.id as string}>Anda</SelectItem>
                )}
                {iomStaff
                  .filter(staff => staff.user_id !== parseInt(session?.user?.id as string))
                  .map((staff) => (
                    <SelectItem key={staff.user_id} value={staff.user_id.toString()}>
                      {staff.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Button onClick={handleOpenDialog} className="bg-var hover:bg-var/90">
              <PlusCircle className="h-4 w-4 mr-2" />
              Buat Jadwal Baru
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-0 w-full overflow-auto shadow-sm">
        <div className="min-w-[800px]">
          {/* Header with days */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-gray-50 border-b">
            <div className="p-3 border-r"></div>
            {weekDays.map((day, index) => (
              <div 
                key={index} 
                className={`p-3 text-center border-r ${
                  isSameDay(day, new Date()) ? 'bg-blue-50' : ''
                }`}
              >
                <p className="font-medium">{format(day, 'EEEE', { locale: id })}</p>
                <p className="text-sm">{format(day, 'd MMM', { locale: id })}</p>
              </div>
            ))}
          </div>
          
          {/* Time slots */}
          <div className="relative">
            {timeSlots.map((timeSlot, timeIndex) => (
              <div key={timeSlot} className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
                <div className="p-2 text-center text-sm border-r">
                  {timeSlot}
                </div>
                
                {weekDays.map((day, dayIndex) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const interviews = interviewsByDay.get(dayStr)?.get(timeSlot) || [];
                  
                  return (
                    <div 
                      key={`${dayStr}-${timeSlot}`} 
                      className={`p-1 border-r min-h-[60px] relative ${
                        isSameDay(day, new Date()) ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {interviews.map((interview) => (
                        <div 
                          key={interview.interview_id}
                          onClick={() => showInterviewDetails(interview)}
                          className="mb-1 p-1 rounded text-xs bg-var text-white cursor-pointer hover:bg-var/90 truncate"
                        >
                          <p className="font-medium truncate">{interview.title || "Wawancara"}</p>
                          <p className="truncate">{format(new Date(interview.start_time), 'HH:mm')} - {format(new Date(interview.end_time), 'HH:mm')}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

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

      {/* Interview Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedInterview?.title || "Detail Wawancara"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedInterview && (
              <>
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(selectedInterview.start_time), "EEEE, d MMMM yyyy", { locale: id })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(selectedInterview.start_time), "HH:mm")} - {format(new Date(selectedInterview.end_time), "HH:mm")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <User className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium">Pengurus IOM</p>
                      <p className="text-sm text-gray-600">
                        {selectedInterview.User.name}
                        {selectedInterview.participants.length > 0 && (
                          <span> dan {selectedInterview.participants.map(p => p.User.name).join(", ")}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {selectedInterview.description && (
                    <div className="mt-2 text-gray-700">
                      <p className="font-medium mb-1">Deskripsi:</p>
                      <p className="text-sm">{selectedInterview.description}</p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <p className="font-medium mb-2">Slot Wawancara:</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedInterview.slots.map((slot) => (
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
                                  className="text-red-500 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelBooking(slot.id);
                                  }}
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
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDetailsDialogOpen(false)}
              >
                Tutup
              </Button>
              <Button 
                variant="outline" 
                className="text-blue-600"
                onClick={() => handleEditInterview(selectedInterview!)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                className="text-red-600"
                onClick={() => handleDeleteInterview(selectedInterview!.interview_id)}
              >
                <Trash className="h-4 w-4 mr-1" />
                Hapus
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}