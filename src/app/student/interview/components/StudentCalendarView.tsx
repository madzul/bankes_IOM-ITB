"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, isWithinInterval } from "date-fns";
import { id } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface InterviewParticipant {
    id: number; // Add this property
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
  student_id: number | null;
  User: {
    name: string;
  };
  Participants: InterviewParticipant[];
  Student?: {
    User: {
      name: string;
    };
  };
}

interface StudentCalendarViewProps {
  slots: InterviewSlot[];
  myBookings: InterviewSlot[];
  handleBookSlot: (slot: InterviewSlot) => void;
  handleCancelBooking: (slotId: number) => void;
}

interface IOMStaff {
  user_id: number;
  name: string;
  email: string;
}



export default function StudentCalendarView({ 
  slots, 
  myBookings, 
  handleBookSlot, 
  handleCancelBooking 
}: StudentCalendarViewProps) {
  const { data: session } = useSession();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedSlot, setSelectedSlot] = useState<InterviewSlot | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [iomStaff, setIomStaff] = useState<IOMStaff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)

  useEffect(() => {
    fetchIOMStaff();
  }, []);

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

  // Generate time slots for the day (all 24 hours)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  }, []);

  const nextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const prevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Filter slots for current week and by selected staff
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
  }, [slots, currentWeekStart, selectedStaffId]);

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

    // Add sorting after the forEach block:
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
          <Select 
            value={selectedStaffId || 'all'} 
            onValueChange={(value) => setSelectedStaffId(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Pilih Pengurus IOM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pengurus</SelectItem>
              {iomStaff.map((staff) => (
                <SelectItem key={staff.user_id} value={staff.user_id.toString()}>
                  {staff.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    
          {/* Time slots with styling */}
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
                        const isMyBooking = slot.student_id === Number(session?.user?.id);
                        const isBooked = slot.student_id !== null;
                        
                        // Calculate exact duration in minutes
                        const durationMinutes = (slotEndTime.getTime() - slotStartTime.getTime()) / (60 * 1000);
                        const heightInPixels = Math.max((durationMinutes / 60) * 80, 40); // Minimum height of 40px for visibility
                        
                        return (
                          <div 
                            key={slot.id}
                            onClick={() => showSlotDetails(slot)}
                            className={`mb-1 p-1 rounded text-xs cursor-pointer hover:opacity-100 absolute left-1 right-1 z-10 ${
                              isMyBooking ? 'bg-green-600 text-white' : 
                              isBooked ? 'bg-gray-400 text-white' : 
                              'bg-blue-200 text-blue-800'
                            }`}
                            style={{ 
                              top: `${slot.minuteOffset || 0}px`,
                              height: `${heightInPixels}px`,
                              pointerEvents: 'auto',
                              opacity: 0.8
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium truncate">{slot.title || "Wawancara"}</span>
                              {isMyBooking && (
                                <Badge className="bg-green-500 text-[7px]">Saya</Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="truncate">
                                {format(slotStartTime, 'HH:mm')} - {format(slotEndTime, 'HH:mm')}
                              </span>
                              {isBooked && !isMyBooking && (
                                <Badge className="bg-red-500 text-[7px]">Booked</Badge>
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
                      <span>
                        {selectedSlot.student_id === Number(session?.user?.id) 
                          ? "Booked by: You" 
                          : "Slot already booked"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Slot available</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Pengurus IOM: {selectedSlot.User.name}</p>
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
                  
                  {selectedSlot.description && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Description:</p>
                      <p className="text-sm text-gray-600">{selectedSlot.description}</p>
                    </div>
                  )}
                </div>
                
                {/* Action buttons based on slot status */}
                {selectedSlot.student_id === Number(session?.user?.id) ? (
                  // I booked this slot - show cancel button
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
                ) : !selectedSlot.student_id ? (
                  // Slot is available - show book button
                  <Button
                    variant="outline" 
                    className="text-green-500"
                    onClick={() => {
                      handleBookSlot(selectedSlot);
                      setIsDetailsDialogOpen(false);
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Book Slot
                  </Button>
                ) : null}
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