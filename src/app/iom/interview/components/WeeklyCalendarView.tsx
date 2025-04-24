"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { PlusCircle, Calendar, Clock, Users, Edit, Trash, User, UserPlus, UserMinus, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, isWithinInterval } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";

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
};

export default function WeeklyCalendarView() {
  const { data: session } = useSession();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState<number | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [selectedSlotDetails, setSelectedSlotDetails] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isSlotDetailsDialogOpen, setIsSlotDetailsDialogOpen] = useState(false);
  const [iomStaff, setIomStaff] = useState<IOMStaff[]>([]);
  
  const [formData, setFormData] = useState<InterviewFormData>({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    maxStudents: 1
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
      const { date, startTime, endTime, maxStudents, title, description } = formData;
      
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
          max_students: maxStudents
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

  const handleJoinInterview = async (interviewId: number) => {
    try {
      const response = await fetch(`/api/interviews/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewId,
        }),
      });

      if (response.ok) {
        toast.success("Joined interview successfully");
        fetchInterviews();
        setIsDetailsDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to join interview");
      }
    } catch (error) {
      console.error("Error joining interview:", error);
      toast.error("Failed to join interview");
    }
  };

  const handleLeaveInterview = async (interviewId: number) => {
    if (confirm("Are you sure you want to leave this interview session?")) {
      try {
        const response = await fetch(`/api/interviews/join`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            interviewId,
          }),
        });

        if (response.ok) {
          toast.success("Left interview successfully");
          fetchInterviews();
          setIsDetailsDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to leave interview");
        }
      } catch (error) {
        console.error("Error leaving interview:", error);
        toast.error("Failed to leave interview");
      }
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
      maxStudents: interview.max_students
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
      maxStudents: 1
    });
    setEditingInterviewId(null);
  };

  const handleOpenDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
      
      // Filter by selected staff (owner or participant)
      if (selectedStaffId) {
        const isOwnedBySelectedStaff = interview.user_id === parseInt(selectedStaffId);
        const isParticipant = interview.participants.some(p => p.user_id === parseInt(selectedStaffId));
        
        return isInCurrentWeek && (isOwnedBySelectedStaff || isParticipant);
      }
      
      return isInCurrentWeek;
    });
  }, [interviews, selectedStaffId, currentWeekStart]);

  // Check if current user is owner or participant of an interview
  const isUserInvolvedInInterview = (interview: Interview) => {
    if (!session?.user?.id) return false;
    
    // Check if user is the owner
    if (interview.user_id === Number(session.user.id)) return true;
    
    // Check if user is a participant
    return interview.participants.some(p => p.user_id === Number(session.user.id));
  };

  // Organize all interview slots by day and time - modified to handle individual slots
  const slotsByDayAndTime = useMemo(() => {
    const result = new Map<string, Map<string, InterviewSlot[]>>();
    
    // Initialize maps for each day and time slot
    weekDays.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      result.set(dayStr, new Map<string, InterviewSlot[]>());
      
      timeSlots.forEach(timeSlot => {
        result.get(dayStr)?.set(timeSlot, []);
      });
    });
    
    // Place individual slots in appropriate day and time slot
    filteredInterviews.forEach(interview => {
      // Handle each slot individually
      interview.slots.forEach(slot => {
        const slotStartTime = new Date(slot.start_time);
        const dayStr = format(slotStartTime, 'yyyy-MM-dd');
        const hourStr = format(slotStartTime, 'HH:00');
        
        if (result.has(dayStr) && result.get(dayStr)?.has(hourStr)) {
          // Add slot with interview reference
          const enhancedSlot = {
            ...slot,
            interview: interview // Add interview reference to slot
          };
          result.get(dayStr)?.get(hourStr)?.push(enhancedSlot as any);
        }
      });
    });
    
    return result;
  }, [filteredInterviews, weekDays, timeSlots]);

  const showInterviewDetails = (interview: Interview) => {
    setSelectedInterview(interview);
    setIsDetailsDialogOpen(true);
  };

  // Helper to show slot details
  const showSlotDetails = (slot: any) => {
    if (slot.interview) {
      setSelectedSlotDetails(slot);
      setIsSlotDetailsDialogOpen(true);
    }
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
                  const slots = slotsByDayAndTime.get(dayStr)?.get(timeSlot) || [];
                  
                  return (
                    <div 
                      key={`${dayStr}-${timeSlot}`} 
                      className={`p-1 border-r min-h-[80px] relative ${
                        isSameDay(day, new Date()) ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {slots.map((slot: any) => {
                        const slotStartTime = new Date(slot.start_time);
                        const slotEndTime = new Date(slot.end_time);
                        const interview = slot.interview;
                        const isOwner = interview.user_id === Number(session?.user?.id);
                        const isParticipant = interview.participants.some(p => p.user_id === Number(session?.user?.id));
                        const hasStudent = !!slot.student_id;
                        
                        return (
                          <div 
                            key={slot.id}
                            onClick={() => showSlotDetails(slot)}
                            className={`mb-1 p-1 rounded text-xs cursor-pointer hover:opacity-90 ${
                              hasStudent ? (
                                isOwner ? 'bg-blue-600 text-white' : 
                                isParticipant ? 'bg-green-600 text-white' : 
                                'bg-var text-white'
                              ) : (
                                isOwner ? 'bg-blue-200 text-blue-800' : 
                                isParticipant ? 'bg-green-200 text-green-800' : 
                                'bg-gray-200 text-gray-800'
                              )
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{interview.title || "Wawancara"}</span>
                              <Badge className="text-[8px] ml-1">{`Slot ${slot.slot_number}`}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="truncate">
                                {format(slotStartTime, 'HH:mm')} - {format(slotEndTime, 'HH:mm')}
                              </span>
                              {hasStudent && (
                                <Badge className="bg-yellow-500 text-[7px]">
                                  {slot.Student?.User?.name ? 
                                    slot.Student.User.name.split(' ')[0] : 
                                    "Booked"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
                <Label htmlFor="maxStudents">Jumlah Slot</Label>
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
                <Label htmlFor="startTime">Waktu Mulai Slot Pertama</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Waktu Selesai Slot Pertama</Label>
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
              <p className="text-sm text-gray-600">
                {formData.maxStudents > 1 ? (
                  <>
                    <strong>Catatan:</strong> Dengan pengaturan ini, {formData.maxStudents} slot akan dibuat secara berurutan dengan durasi yang sama:
                    {formData.date && formData.startTime && formData.endTime && (
                      <ul className="mt-2 pl-5 list-disc">
                        {Array.from({ length: formData.maxStudents }).map((_, index) => {
                          if (formData.date && formData.startTime && formData.endTime) {
                            const startDate = new Date(`${formData.date}T${formData.startTime}`);
                            const endDate = new Date(`${formData.date}T${formData.endTime}`);
                            const slotDuration = endDate.getTime() - startDate.getTime();
                            
                            const slotStart = new Date(startDate.getTime() + (index * slotDuration));
                            const slotEnd = new Date(slotStart.getTime() + slotDuration);
                            
                            return (
                              <li key={index}>
                                Slot {index + 1}: {format(slotStart, 'HH:mm')} - {format(slotEnd, 'HH:mm')}
                              </li>
                            );
                          }
                          return null;
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  "Slot akan dibuat sesuai dengan waktu yang Anda tentukan."
                )}
              </p>
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
                        Durasi keseluruhan: {format(new Date(selectedInterview.start_time), "HH:mm")} - {format(new Date(selectedInterview.end_time), "HH:mm")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Users className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Pengurus IOM</p>
                        {selectedInterview.user_id === Number(session?.user?.id) && (
                          <Badge className="bg-blue-500">Anda</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {selectedInterview.User.name}
                      </p>
                      {selectedInterview.participants.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">Peserta</p>
                          <ul className="text-sm text-gray-600">
                            {selectedInterview.participants.map(p => (
                              <li key={p.id} className="flex items-center">
                                {p.User.name}
                                {p.user_id === Number(session?.user?.id) && (
                                  <Badge className="ml-2 bg-green-500 text-xs">Anda</Badge>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedInterview.description && (
                    <div className="mt-2 text-gray-700">
                      <p className="font-medium mb-1">Deskripsi:</p>
                      <p className="text-sm">{selectedInterview.description}</p>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <p className="font-medium mb-2">Status Slot:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-gray-100 rounded">
                        <p className="text-sm font-medium">Total Slot</p>
                        <p className="text-lg">{selectedInterview.slots.length}</p>
                      </div>
                      <div className="p-2 bg-blue-100 rounded">
                        <p className="text-sm font-medium">Slot Terisi</p>
                        <p className="text-lg">{selectedInterview.slots.filter(s => s.student_id !== null).length}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Klik pada slot di kalender untuk melihat detail slot</p>
                  </div>
                  
                  <div className="mt-4">
                    <p className="font-medium mb-2">Daftar Slot:</p>
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
                                {isUserInvolvedInInterview(selectedInterview) && (
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
                                )}
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
            <div className="flex space-x-2 w-full justify-between">
              <div>
                {selectedInterview && selectedInterview.user_id !== Number(session?.user?.id) && (
                  selectedInterview.participants.some(p => p.user_id === Number(session?.user?.id)) ? (
                    <Button 
                      variant="outline" 
                      className="text-red-600"
                      onClick={() => handleLeaveInterview(selectedInterview.interview_id)}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Tinggalkan Sesi
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="text-green-600"
                      onClick={() => handleJoinInterview(selectedInterview.interview_id)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Ikuti Sesi
                    </Button>
                  )
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailsDialogOpen(false)}
                >
                  Tutup
                </Button>
                
                {selectedInterview && selectedInterview.user_id === Number(session?.user?.id) && (
                  <>
                    <Button 
                      variant="outline" 
                      className="text-blue-600"
                      onClick={() => handleEditInterview(selectedInterview)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-600"
                      onClick={() => handleDeleteInterview(selectedInterview.interview_id)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Hapus
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}