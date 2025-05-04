"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { PlusCircle, Calendar, Clock, User, Edit, Trash, UserPlus, UserMinus, ChevronLeft, ChevronRight, Info, X } from "lucide-react";
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
  title: string | null;
  description: string | null;
  start_time: string;
  end_time: string;
  user_id: number;
  period_id: number;
  student_id: number | null;
  User: {
    name: string;
    email: string;
  };
  Participants: InterviewParticipant[];
  Student?: {
    User: {
      name: string;
    };
  };
}

type SlotFormData = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  studentCount: number; // Add this new field
};

export default function WeeklyCalendarView() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedSlot, setSelectedSlot] = useState<InterviewSlot | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [iomStaff, setIomStaff] = useState<IOMStaff[]>([]);
  
  const [formData, setFormData] = useState<SlotFormData>({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    studentCount: 1
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
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  // Fetch slots and IOM staff
  useEffect(() => {
    fetchSlots();
    fetchIOMStaff();
  }, []);

  // Set current user as default selected staff
  useEffect(() => {
    if (session?.user?.id) {
      setSelectedStaffId(session.user.id as string);
    }
  }, [session]);

  const fetchSlots = async () => {
    try {
      const response = await fetch("/api/slots");
      if (response.ok) {
        const data = await response.json();
        setSlots(data.data);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Failed to load slots");
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

  const handleCreateOrUpdateSlot = async () => {
    setIsLoading(true);
    try {
      // Format start and end times
      const { date, startTime, endTime, title, description, studentCount } = formData;
      
      if (editingSlotId) {
        // Just update the single slot as before
        const combinedStartTime = `${date}T${startTime}:00`;
        const combinedEndTime = `${date}T${endTime}:00`;
        
        const response = await fetch(`/api/slots/${editingSlotId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            start_time: combinedStartTime,
            end_time: combinedEndTime,
          }),
        });
  
        if (response.ok) {
          toast.success("Slot updated successfully");
          fetchSlots();
          setIsDialogOpen(false);
          resetForm();
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to update slot");
        }
      } else {
        // Create multiple slots if studentCount > 1
        const startDateObj = new Date(`${date}T${startTime}`);
        const endDateObj = new Date(`${date}T${endTime}`);
        const durationMs = endDateObj.getTime() - startDateObj.getTime();
        
        const createPromises = [];
        
        for (let i = 0; i < studentCount; i++) {
          const slotStartTime = new Date(startDateObj.getTime() + (i * durationMs));
          const slotEndTime = new Date(slotStartTime.getTime() + durationMs);
          
          const formattedStartTime = slotStartTime.toISOString();
          const formattedEndTime = slotEndTime.toISOString();
          
          createPromises.push(
            fetch("/api/slots", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title,
                description,
                start_time: formattedStartTime,
                end_time: formattedEndTime,
              }),
            })
          );
        }
        
        const responses = await Promise.all(createPromises);
        const allSuccessful = responses.every(response => response.ok);
        
        if (allSuccessful) {
          toast.success(`${studentCount} slots created successfully`);
          fetchSlots();
          setIsDialogOpen(false);
          resetForm();
        } else {
          toast.error("Failed to create some slots");
        }
      }
    } catch (error) {
      console.error("Error saving slot:", error);
      toast.error("Failed to save slot");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSlot = async (slotId: number) => {
    try {
      const response = await fetch(`/api/slots/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slotId }),
      });
  
      if (response.ok) {
        toast.success("Joined slot successfully");
        fetchSlots();
        setIsDetailsDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to join slot");
      }
    } catch (error) {
      console.error("Error joining slot:", error);
      toast.error("Failed to join slot");
    }
  };
  
  const handleLeaveSlot = async (slotId: number) => {
    if (confirm("Are you sure you want to leave this slot?")) {
      try {
        const response = await fetch(`/api/slots/join`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slotId }),
        });
  
        if (response.ok) {
          toast.success("Left slot successfully");
          fetchSlots();
          setIsDetailsDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to leave slot");
        }
      } catch (error) {
        console.error("Error leaving slot:", error);
        toast.error("Failed to leave slot");
      }
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (confirm("Are you sure you want to delete this slot?")) {
      try {
        const response = await fetch(`/api/slots/${slotId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Slot deleted successfully");
          fetchSlots();
          setIsDetailsDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to delete slot");
        }
      } catch (error) {
        console.error("Error deleting slot:", error);
        toast.error("Failed to delete slot");
      }
    }
  };

  const handleCancelBooking = async (slotId: number) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      try {
        const response = await fetch(`/api/slots/${slotId}/cancel`, {
          method: "POST",
        });

        if (response.ok) {
          toast.success("Booking cancelled successfully");
          fetchSlots();
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

  const isUserParticipantInSlot = (slot: InterviewSlot) => {
    if (!session?.user?.id) return false;
    
    // Check if there's a participant record with this user's ID
    return slot.Participants.some(p => p.user_id === Number(session.user.id));
  };

  const handleEditSlot = (slot: InterviewSlot) => {
    const startDateTime = new Date(slot.start_time);
    const endDateTime = new Date(slot.end_time);
    
    setFormData({
      title: slot.title || "",
      description: slot.description || "",
      date: format(startDateTime, "yyyy-MM-dd"),
      startTime: format(startDateTime, "HH:mm"),
      endTime: format(endDateTime, "HH:mm"),
      studentCount: 1
    });
    
    setEditingSlotId(slot.id);
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
      studentCount: 1
    });
    setEditingSlotId(null);
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

  // Filter slots by selected staff and current week
  const filteredSlots = useMemo(() => {
    return slots.filter(slot => {
      const slotStart = new Date(slot.start_time);
      
      // Check if slot is within the current week
      const isInCurrentWeek = isWithinInterval(slotStart, {
        start: currentWeekStart,
        end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
      });
      
      // Filter by selected staff (owner or participant)
      if (selectedStaffId) {
        const isOwnedBySelectedStaff = slot.user_id === parseInt(selectedStaffId);
        const isParticipant = slot.Participants.some(p => p.user_id === parseInt(selectedStaffId));
        
        return isInCurrentWeek && (isOwnedBySelectedStaff || isParticipant);
      }
      
      return isInCurrentWeek;
    });
  }, [slots, selectedStaffId, currentWeekStart]);

  // Check if current user is owner or participant of a slot
  const isUserInvolvedInSlot = (slot: InterviewSlot) => {
    if (!session?.user?.id) return false;
    
    // Check if user is the owner
    if (slot.user_id === Number(session.user.id)) return true;
    
    // Check if user is a participant
    return slot.Participants.some(p => p.user_id === Number(session.user.id));
  };

  // Organize all slots by day and time
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

    result.forEach((dayMap) => {
      dayMap.forEach((slots) => {
        slots.sort((a: any, b: any) => a.exactStartTime - b.exactStartTime);
      });
    });
    
    // Place slots in appropriate day and time slot
    filteredSlots.forEach(slot => {
      const slotStartTime = new Date(slot.start_time);
      const dayStr = format(slotStartTime, 'yyyy-MM-dd');
      
      // Get exact position based on hour and minutes
      const startHours = slotStartTime.getHours();
      const startMinutes = slotStartTime.getMinutes();
      
      // Calculate the pixel offset based on minutes within the hour
      const minuteOffset = (startMinutes / 60) * 80; // 80px is the height per hour cell
      
      // Store the slot with positioning information
      const slotHour = `${startHours.toString().padStart(2, '0')}:00`;
      
      if (result.has(dayStr) && result.get(dayStr)?.has(slotHour)) {
        // Add slot with duration and position info
        const slotEndTime = new Date(slot.end_time);
        const enhancedSlot = {
          ...slot,
          duration: Math.ceil((slotEndTime.getTime() - slotStartTime.getTime()) / (60 * 60 * 1000)), // Duration in hours
          minuteOffset, // Add exact minute position
          exactStartTime: slotStartTime.getTime(), // For sorting purposes
        };
        result.get(dayStr)?.get(slotHour)?.push(enhancedSlot as any);
      }
    });
    
    return result;
  }, [filteredSlots, weekDays, timeSlots]);

  const showSlotDetails = (slot: InterviewSlot) => {
    setSelectedSlot(slot);
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
              Buat Slot Baru
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
                        const isOwner = slot.user_id === Number(session?.user?.id);
                        const isParticipant = slot.Participants.some((p: { user_id: number; }) => p.user_id === Number(session?.user?.id));
                        const hasStudent = !!slot.student_id;
                        
                        // Calculate exact duration in minutes
                        const durationMinutes = (slotEndTime.getTime() - slotStartTime.getTime()) / (60 * 1000);
                        const heightInPixels = Math.max((durationMinutes / 60) * 80, 40); // Minimum height of 40px for visibility
                        
                        return (
                          <div 
                            key={slot.id}
                            onClick={() => showSlotDetails(slot)}
                            className={`mb-1 p-1 rounded text-xs cursor-pointer hover:opacity-90 absolute left-1 right-1 z-10 ${
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
                            style={{ 
                              top: `${slot.minuteOffset || 0}px`,
                              height: `${heightInPixels}px`,
                              pointerEvents: 'auto'
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{slot.title || "Wawancara"}</span>
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

      {/* Create/Edit Slot Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingSlotId ? "Edit Slot Wawancara" : "Buat Slot Wawancara Baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Judul Slot Wawancara"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi tambahan mengenai slot wawancara"
                rows={3}
              />
            </div>
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
              {!editingSlotId && (
                <div className="space-y-2">
                  <Label htmlFor="studentCount">Jumlah Mahasiswa</Label>
                  <Input
                    id="studentCount"
                    type="number"
                    value={formData.studentCount}
                    onChange={(e) => setFormData({ ...formData, studentCount: parseInt(e.target.value) || 1 })}
                    required
                  />
                  {formData.studentCount > 1 && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm">
                      <p className="font-medium mb-1">Jadwal slot yang akan dibuat:</p>
                      {Array.from({ length: formData.studentCount }).map((_, index) => {
                        const startDate = new Date(`${formData.date}T${formData.startTime}`);
                        const endDate = new Date(`${formData.date}T${formData.endTime}`);
                        const durationMs = endDate.getTime() - startDate.getTime();
                        
                        const slotStartTime = new Date(startDate.getTime() + (index * durationMs));
                        const slotEndTime = new Date(slotStartTime.getTime() + durationMs);
                        
                        return (
                          <p key={index} className="text-gray-700">
                            Slot {index + 1}: {format(slotStartTime, "HH:mm")} - {format(slotEndTime, "HH:mm")}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button 
              onClick={handleCreateOrUpdateSlot} 
              disabled={isLoading || !formData.date || !formData.startTime || !formData.endTime}
              className="bg-var hover:bg-var/90"
            >
              {isLoading ? "Memproses..." : editingSlotId ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slot Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detail Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedSlot && (
              <>
                <div className="space-y-2">
                  <p className="font-medium">{selectedSlot.title || "Slot Wawancara"}</p>
                  <p className="text-sm">
                    {format(new Date(selectedSlot.start_time), "EEEE, d MMMM yyyy", { locale: id })}
                  </p>
                  <p className="text-sm">
                    {format(new Date(selectedSlot.start_time), "HH:mm")} - {format(new Date(selectedSlot.end_time), "HH:mm")}
                  </p>
                  {selectedSlot.student_id ? (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-blue-500" />
                      <span>Booked by: {selectedSlot.Student?.User?.name || "Student"}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Slot available</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Slot Owner: {selectedSlot.User.name}</p>
                  {selectedSlot.Participants.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="text-sm">Participants:</p>
                      <ul className="text-sm ml-5 list-disc">
                        {selectedSlot.Participants.map((p) => (
                          <li key={p.id}>{p.User.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {isUserInvolvedInSlot(selectedSlot) ? (
                  selectedSlot.user_id !== Number(session?.user?.id) && (
                    <Button
                      variant="outline" 
                      className="text-red-500"
                      onClick={() => handleLeaveSlot(selectedSlot.id)}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Leave Slot
                    </Button>
                  )
                ) : (
                  <Button
                    variant="outline" 
                    className="text-green-500"
                    onClick={() => handleJoinSlot(selectedSlot.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Join Slot
                  </Button>
                )}
                
                {isUserInvolvedInSlot(selectedSlot) && selectedSlot.student_id && (
                  <Button
                    variant="outline" 
                    className="text-red-500"
                    onClick={() => {
                      handleCancelBooking(selectedSlot.id);
                      setIsDetailsDialogOpen(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel Booking
                  </Button>
                )}

                {selectedSlot.user_id === Number(session?.user?.id) && (
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium">Slot Management:</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" 
                        className="text-blue-500"
                        onClick={() => {
                          setIsDetailsDialogOpen(false);
                          handleEditSlot(selectedSlot);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Slot
                      </Button>
                      
                      <Button
                        variant="outline" 
                        className="text-red-500"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this slot? This action cannot be undone.")) {
                            handleDeleteSlot(selectedSlot.id);
                            setIsDetailsDialogOpen(false);
                          }
                        }}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Delete Slot
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
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}