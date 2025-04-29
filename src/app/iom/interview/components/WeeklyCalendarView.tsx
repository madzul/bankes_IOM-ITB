"use client";

import { useState, useEffect, useMemo, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import { Card } from "@/components/ui/card";
import { PlusCircle, Calendar, Clock, Users, Edit, Trash, User, UserPlus, UserMinus, ChevronLeft, ChevronRight, Info, X } from "lucide-react";
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
  slot_id?: number; // Add this field
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

  const [isEditSlotDialogOpen, setIsEditSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  
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
    // Change this to show all 24 hours instead of just 8-17
    for (let hour = 0; hour < 24; hour++) {
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

  const handleJoinInterview = async (interviewId: number, slotId: number) => {
    try {
      const response = await fetch(`/api/interviews/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewId,
          slotId,
        }),
      });
  
      if (response.ok) {
        toast.success("Joined interview slot successfully");
        fetchInterviews();
        setIsDetailsDialogOpen(false);
        setIsSlotDetailsDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to join interview slot");
      }
    } catch (error) {
      console.error("Error joining interview slot:", error);
      toast.error("Failed to join interview slot");
    }
  };
  
  const handleLeaveInterview = async (interviewId: number, slotId: number) => {
    if (confirm("Are you sure you want to leave this interview slot?")) {
      try {
        const response = await fetch(`/api/interviews/join`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            interviewId,
            slotId,
          }),
        });
  
        if (response.ok) {
          toast.success("Left interview slot successfully");
          fetchInterviews();
          setIsDetailsDialogOpen(false);
          setIsSlotDetailsDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to leave interview slot");
        }
      } catch (error) {
        console.error("Error leaving interview slot:", error);
        toast.error("Failed to leave interview slot");
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

  const isUserParticipantInSlot = (interview: Interview, slotId: number) => {
    if (!session?.user?.id) return false;
    
    // Check if there's a participant record with this user's ID and the specified slot ID
    return interview.participants.some(p => 
      p.user_id === Number(session.user.id) && p.slot_id === slotId
    );
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

  const handleEditSingleSlot = (slot: any) => {
    setEditingSlot({
      id: slot.id,
      slotNumber: slot.slot_number,
      date: format(new Date(slot.start_time), "yyyy-MM-dd"),
      startTime: format(new Date(slot.start_time), "HH:mm"),
      endTime: format(new Date(slot.end_time), "HH:mm"),
      interviewId: slot.interview.interview_id
    });
    setIsEditSlotDialogOpen(true);
  };
  
  const saveSlotChanges = async () => {
    if (!editingSlot) return;
    
    setIsLoading(true);
    try {
      const combinedStartTime = `${editingSlot.date}T${editingSlot.startTime}:00`;
      const combinedEndTime = `${editingSlot.date}T${editingSlot.endTime}:00`;
      
      const response = await fetch(`/api/interviews/slots/${editingSlot.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start_time: combinedStartTime,
          end_time: combinedEndTime,
        }),
      });
  
      if (response.ok) {
        toast.success("Slot updated successfully");
        fetchInterviews();
        setIsEditSlotDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update slot");
      }
    } catch (error) {
      console.error("Error updating slot:", error);
      toast.error("Failed to update slot");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSingleSlot = async (slotId: number, interviewId: number) => {
    try {
      // First, we need to fetch the current slots to calculate the new max_students value
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: "GET",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch interview details");
      }
      
      const interview = await response.json();
      const currentSlots = interview.data.slots || [];
      
      // If this is the only slot, delete the entire interview
      if (currentSlots.length <= 1) {
        return handleDeleteInterview(interviewId);
      }
      
      // Delete the specific slot
      const deleteSlotResponse = await fetch(`/api/interviews/slots/${slotId}`, {
        method: "DELETE",
      });
      
      if (!deleteSlotResponse.ok) {
        const error = await deleteSlotResponse.json();
        throw new Error(error.error || "Failed to delete slot");
      }
      
      // Update the interview's max_students value
      const updateInterviewResponse = await fetch(`/api/interviews/${interviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          max_students: currentSlots.length - 1
        }),
      });
      
      if (!updateInterviewResponse.ok) {
        toast.warning("Slot deleted but failed to update session details");
      }
      
      toast.success("Slot deleted successfully");
      fetchInterviews();
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast.error("Failed to delete slot");
    }
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
      /**
       * Not used for now 
       */
      // const interviewEnd = new Date(interview.end_time);
      
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
      interview.slots.forEach(slot => {
        const slotStartTime = new Date(slot.start_time);
        const slotEndTime = new Date(slot.end_time);
        const dayStr = format(slotStartTime, 'yyyy-MM-dd');
        
        // Get hour for initial placement
        const slotHour = `${slotStartTime.getHours().toString().padStart(2, '0')}:00`;
        
        if (result.has(dayStr) && result.get(dayStr)?.has(slotHour)) {
          // Add slot with interview reference and duration info
          const enhancedSlot = {
            ...slot,
            interview: interview,
            duration: Math.ceil((slotEndTime.getTime() - slotStartTime.getTime()) / (60 * 60 * 1000)) // Duration in hours
          };
          result.get(dayStr)?.get(slotHour)?.push(enhancedSlot as any);
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
      setSelectedSlotDetails({
        ...slot,
        interview: slot.interview
      });
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

      <Card className="p-0 w-full overflow-auto shadow-sm border-none">
      <div className="min-w-[800px]">
          {/* Header with days - remove borders */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-white">
            <div className="p-3 bg-white"></div>
            {weekDays.map((day, index) => (
              <div 
                key={index} 
                className={`p-3 text-center ${
                  isSameDay(day, new Date()) ? 'bg-blue-50 font-bold' : ''
                }`}
              >
                <p className="font-medium">{format(day, 'EEEE', { locale: id })}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className={`${
                    isSameDay(day, new Date()) ? 
                    'bg-var text-white rounded-full w-8 h-8 flex items-center justify-center' : 
                    ''
                  }`}>
                    {format(day, 'd')}
                  </div>
                  <span className="text-sm">{format(day, 'MMM', { locale: id })}</span>
                </div>
              </div>
            ))}
          </div>
    
          
          {/* Time slots - add subtle styling */}
          <div className="relative">
            {timeSlots.map((timeSlot, timeIndex) => (
              <div 
                key={timeSlot} 
                className={`grid grid-cols-[60px_repeat(7,1fr)] border-b ${
                  timeIndex % 2 === 0 ? 'bg-gray-50/30' : ''
                }`}
              >
                <div className="flex items-start border-r bg-white relative z-10">
                  <div className="font-roboto font-medium px-2 -mt-2.5 text-gray-700 text-sm bg-white">
                    {timeSlot}
                  </div>
                </div>
                
                {weekDays.map((day) => {
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
                      const isParticipant = interview.participants.some((p: { user_id: number; }) => p.user_id === Number(session?.user?.id));
                      const hasStudent = !!slot.student_id;
                      
                      // Calculate the duration in hours (or in pixels if preferred)
                      const durationHours = (slotEndTime.getTime() - slotStartTime.getTime()) / (60 * 60 * 1000);
                      const heightInPixels = Math.max(durationHours * 80, 80); // Assuming each hour cell is 80px
                      
                      return (
                        <div 
                          key={slot.id}
                          onClick={() => showSlotDetails(slot)}
                          className={`mb-1 p-1 rounded text-xs cursor-pointer hover:opacity-90 absolute left-1 right-1 z-10 ${
                            hasStudent ? (
                              isOwner ? 'bg-blue-600 text-white' : 
                              interview.participants.some((p: { user_id: number; slot_id: any; }) => p.user_id === Number(session?.user?.id) && p.slot_id === slot.id) ? 'bg-green-600 text-white' : 
                              'bg-var text-white'
                            ) : (
                              isOwner ? 'bg-blue-200 text-blue-800' : 
                              interview.participants.some((p: { user_id: number; slot_id: any; }) => p.user_id === Number(session?.user?.id) && p.slot_id === slot.id) ? 'bg-green-200 text-green-800' : 
                              'bg-gray-200 text-gray-800'
                            )
                          }`}
                          style={{ 
                            top: '0', // Change from '1px' to '0'
                            height: `${heightInPixels}px`, // Remove the subtraction 
                            pointerEvents: 'auto'
                          }}
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
          {/* Add hour lines for better visual reference */}
          <div className="absolute inset-0 grid grid-cols-[60px_repeat(7,1fr)] pointer-events-none">
            {timeSlots.map((_, timeIndex) => (
              <div 
                key={timeIndex} 
                className="col-span-8 border-t border-gray-200" 
                style={{ height: '80px', marginTop: '-1px' }}
              ></div>
            ))}
          </div>
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
    <Dialog open={isSlotDetailsDialogOpen} onOpenChange={setIsSlotDetailsDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Slot Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {selectedSlotDetails && (
            <>
              <div className="space-y-2">
                <p className="font-medium">{selectedSlotDetails.interview.title || "Interview Session"}</p>
                <p className="text-sm">
                  Slot {selectedSlotDetails.slot_number}: {format(new Date(selectedSlotDetails.start_time), "HH:mm")} - {format(new Date(selectedSlotDetails.end_time), "HH:mm")}
                </p>
                {selectedSlotDetails.student_id ? (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Booked by: {selectedSlotDetails.Student?.User?.name || "Student"}</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Slot available</p>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Session Owner: {selectedSlotDetails.interview.User.name}</p>
                {/* Only show participants for this specific slot */}
                {selectedSlotDetails.interview.participants
                  .filter((p: { slot_id: any; }) => p.slot_id === selectedSlotDetails.id)
                  .length > 0 && (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm">Slot Participants:</p>
                    <ul className="text-sm ml-5 list-disc">
                      {selectedSlotDetails?.interview.participants
                      .filter((p: { slot_id: any; }) => p.slot_id === selectedSlotDetails.id)  // Only show participants of this specific slot
                      .map((p: { id: Key | null | undefined; User: { name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }; }) => (
                        <li key={p.id}>{p.User.name}</li>
                      ))
                    }
                    </ul>
                  </div>
                )}
              </div>
              
              {isUserInvolvedInInterview(selectedSlotDetails.interview) ? (
                selectedSlotDetails.interview.user_id !== Number(session?.user?.id) && (
                  <Button
                    variant="outline" 
                    className="text-red-500"
                    onClick={() => {
                      handleLeaveInterview(
                        selectedSlotDetails.interview.interview_id,
                        selectedSlotDetails.id
                      );
                    }}
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    Leave Slot
                  </Button>
                )
              ) : (
                <Button
                  variant="outline" 
                  className="text-green-500"
                  onClick={() => {
                    handleJoinInterview(
                      selectedSlotDetails.interview.interview_id, 
                      selectedSlotDetails.id
                    );
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Join Slot
                </Button>
              )}
              
              {isUserInvolvedInInterview(selectedSlotDetails.interview) && selectedSlotDetails.student_id && (
                <Button
                  variant="outline" 
                  className="text-red-500"
                  onClick={() => {
                    handleCancelBooking(selectedSlotDetails.id);
                    setIsSlotDetailsDialogOpen(false);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel Booking
                </Button>
              )}
{selectedSlotDetails && selectedSlotDetails.interview.user_id === Number(session?.user?.id) && (
  <div className="space-y-2 mt-4">
    <p className="text-sm font-medium">Session Management:</p>
    <div className="flex gap-2">
      {/* Delete single slot option */}
      {selectedSlotDetails.interview.max_students > 1 && (
        <Button
          variant="outline" 
          className="text-amber-500"
          onClick={() => {
            if (confirm(`Are you sure you want to delete Slot ${selectedSlotDetails.slot_number} from this interview session?`)) {
              // Call a new function to delete just this slot
              handleDeleteSingleSlot(selectedSlotDetails.id, selectedSlotDetails.interview.interview_id);
              setIsSlotDetailsDialogOpen(false);
            }
          }}
        >
          <Trash className="h-4 w-4 mr-1" />
          Delete This Slot
        </Button>
      )}

      {/* Edit single slot option */}
      {selectedSlotDetails.interview.user_id === Number(session?.user?.id) && (
        <Button
          variant="outline" 
          className="text-blue-500"
          onClick={() => {
            setIsSlotDetailsDialogOpen(false);
            // Open a new dialog for editing this specific slot
            handleEditSingleSlot(selectedSlotDetails);
          }}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit This Slot
        </Button>
      )}
      
      {/* Delete entire interview option */}
      <Button
        variant="outline" 
        className="text-red-500"
        onClick={() => {
          if (confirm("Are you sure you want to delete the entire interview session? This will delete all slots and bookings.")) {
            handleDeleteInterview(selectedSlotDetails.interview.interview_id);
            setIsSlotDetailsDialogOpen(false);
          }
        }}
      >
        <Trash className="h-4 w-4 mr-1" />
        Delete Entire Session
      </Button>
    </div>
  </div>
)}
            </>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsSlotDetailsDialogOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit Slot Dialog */}
<Dialog open={isEditSlotDialogOpen} onOpenChange={setIsEditSlotDialogOpen}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Edit Slot {editingSlot?.slotNumber}</DialogTitle>
    </DialogHeader>
    <div className="py-4">
      {editingSlot && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={editingSlot.date}
              onChange={(e) => setEditingSlot({ ...editingSlot, date: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={editingSlot.startTime}
                onChange={(e) => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={editingSlot.endTime}
                onChange={(e) => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
                required
              />
            </div>
          </div>
        </div>
      )}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsEditSlotDialogOpen(false)}>
        Cancel
      </Button>
      <Button 
        onClick={saveSlotChanges} 
        disabled={isLoading}
        className="bg-var hover:bg-var/90"
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </>
  );
}