"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import SidebarMahasiswa from "@/app/components/layout/sidebarmahasiswa";
import { useSession } from "next-auth/react";
import { Calendar as CalendarIcon, Clock, User, Check, X, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, parseISO, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { toast, Toaster } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import dynamic from "next/dynamic";

// Dynamically import calendar view component
const StudentCalendarView = dynamic(() => import("./components/StudentCalendarView"), {
  loading: () => <div className="w-full text-center py-10">Loading calendar view...</div>,
});

// Types
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

export default function StudentInterviewPage() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [myBookings, setMyBookings] = useState<InterviewSlot[]>([]);
  const [filter, setFilter] = useState("upcoming");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<InterviewSlot | null>(null);
  const [activeTab, setActiveTab] = useState("available");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  
  useEffect(() => {
    fetchSlots();
  }, []);
  useEffect(() => {
    const bookings = slots.filter((slot: InterviewSlot) => 
      slot.student_id === Number(session?.user?.id)
    );
    setMyBookings(bookings);
  }, [slots, session]);

  const fetchSlots = async () => {
    try {
      const response = await fetch("/api/slots");
      if (response.ok) {
        const data = await response.json();
        setSlots(data.data);
        
        // Extract my bookings
        const bookings = data.data.filter((slot: InterviewSlot) => 
          slot.student_id === Number(session?.user?.id)
        );
        setMyBookings(bookings);
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("Failed to load slots");
    }
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/slots/${selectedSlot.id}/book`, {
        method: "POST",
      });
  
      if (response.ok) {
        toast.success("Slot reserved successfully");
        fetchSlots(); // This will update both slots and myBookings
        setConfirmDialogOpen(false);
      } else {
        const error = await response.json();
        if (error.existingSlotId) {
          toast.error("You already have a booking for this period");
        } else {
          toast.error(error.error || "Failed to book slot");
        }
      }
    } catch (error) {
      console.error("Error booking slot:", error);
      toast.error("Failed to book slot");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (slotId: number) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/slots/${slotId}/cancel`, {
          method: "POST",
        });
  
        if (response.ok) {
          toast.success("Booking cancelled successfully");
          
          // Remove the booking from myBookings
          const updatedBookings = myBookings.filter(booking => booking.id !== slotId);
          setMyBookings(updatedBookings);
          
          // Update the slot in the slots list
          setSlots(prevSlots => 
            prevSlots.map(slot => 
              slot.id === slotId ? { ...slot, student_id: null, booked_at: null } : slot
            )
          );
          
          // Also fetch fresh data to ensure sync
          fetchSlots();
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || "Failed to cancel booking");
        }
      } catch (error) {
        console.error("Error cancelling booking:", error);
        toast.error("Failed to cancel booking");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const openConfirmDialog = (slot: InterviewSlot) => {
    setSelectedSlot(slot);
    setConfirmDialogOpen(true);
  };

  // Filter slots
  const filteredSlots = slots.filter(slot => {
    const slotDate = new Date(slot.start_time);
    const today = new Date();
    
    if (filter === "upcoming") {
      return slotDate >= today;
    } else if (filter === "past") {
      return slotDate < today;
    } else if (filter === "date" && selectedDate) {
      return isSameDay(slotDate, parseISO(selectedDate));
    }
    return true;
  });

  const renderListView = () => (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available">Jadwal Tersedia</TabsTrigger>
          <TabsTrigger value="my-bookings">Jadwal Saya</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available" className="space-y-6">
          <div className="mb-6 flex items-center space-x-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter wawancara" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jadwal</SelectItem>
                <SelectItem value="upcoming">Jadwal Mendatang</SelectItem>
                <SelectItem value="past">Jadwal Sebelumnya</SelectItem>
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
          </div>

          {filteredSlots.length === 0 ? (
            <Card className="p-8 w-full text-center">
              <p className="text-gray-500">Tidak ada jadwal wawancara yang tersedia.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSlots.map((slot) => {
                const isMyBooking = slot.student_id === Number(session?.user?.id);
                const isBooked = slot.student_id !== null;
                
                return (
                  <Card key={slot.id} className={`p-4 w-full rounded-md border ${
                    isMyBooking 
                      ? 'bg-green-50 border-green-200' 
                      : isBooked 
                        ? 'bg-gray-100 border-gray-200' 
                        : 'bg-white border-gray-200 hover:border-blue-300 transition-colors'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="font-medium">{slot.title || "Slot Wawancara"}</h2>
                        {isMyBooking && (
                          <Badge className="bg-green-500 mt-1">Jadwal Saya</Badge>
                        )}
                        {isBooked && !isMyBooking && (
                          <Badge variant="outline" className="text-gray-500 border-gray-300 mt-1">Sudah Dibooking</Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm flex items-center mb-1">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                      {format(new Date(slot.start_time), "EEEE, d MMMM yyyy", { locale: id })}
                    </p>
                    <p className="text-sm flex items-center mb-1">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
                      {format(new Date(slot.start_time), "HH:mm")} - {format(new Date(slot.end_time), "HH:mm")}
                    </p>
                    <p className="text-sm flex items-center mb-3">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      {slot.User.name}
                      {slot.Participants.length > 0 && (
                        <span className="ml-1 text-xs text-gray-600">
                          (+{slot.Participants.length} pengurus)
                        </span>
                      )}
                    </p>
                    
                    {slot.description && (
                      <p className="text-sm text-gray-600 mb-3">{slot.description}</p>
                    )}
                    
                    {isMyBooking ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-red-500 hover:text-red-700 mt-2"
                        onClick={() => handleCancelBooking(slot.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Batalkan
                      </Button>
                    ) : !isBooked ? (
                      <Button 
                        size="sm" 
                        className="w-full bg-var hover:bg-var/90 mt-2"
                        onClick={() => openConfirmDialog(slot)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Pilih Slot
                      </Button>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-bookings">
          {myBookings.length === 0 ? (
            <Card className="p-8 w-full text-center">
              <p className="text-gray-500">Anda belum memiliki jadwal wawancara.</p>
              <Button 
                className="mt-4 bg-var hover:bg-var/90"
                onClick={() => setActiveTab("available")}
              >
                Lihat Jadwal yang Tersedia
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {myBookings.map((booking) => (
                <Card key={booking.id} className="p-6 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold">
                        {booking.title || "Slot Wawancara"}
                        <Badge className="ml-3 bg-green-500">Booked</Badge>
                      </h2>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                          {format(new Date(booking.start_time), "EEEE, d MMMM yyyy", { locale: id })}
                        </p>
                        <p className="text-sm flex items-center font-medium">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          {format(new Date(booking.start_time), "HH:mm")} - {format(new Date(booking.end_time), "HH:mm")}
                        </p>
                        <p className="text-sm flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          {booking.User.name}
                          {booking.Participants.length > 0 && (
                            <span className="ml-1 text-xs text-gray-600">
                              (+{booking.Participants.length} pengurus)
                            </span>
                          )}
                        </p>
                        {booking.description && (
                          <p className="text-sm mt-2">{booking.description}</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Batalkan
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="bottom-right" richColors />
      <div className="w-1/4 m-8">
        <SidebarMahasiswa activeTab="interview" />
      </div>

      <div className="my-8 mr-8 w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Jadwal Wawancara</h1>
          
          {/* View switcher */}
          <Card className="border p-1">
            <Tabs 
              defaultValue="list" 
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "calendar" | "list")}
              className="w-[180px]"
            >
              <TabsList className="grid grid-cols-2 h-9 w-full">
                <TabsTrigger value="calendar" className="px-3 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">Kalender</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="px-3 flex items-center gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Daftar</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>
        </div>

        {viewMode === "calendar" ? (
          <StudentCalendarView 
            slots={slots} 
            myBookings={myBookings}
            handleBookSlot={openConfirmDialog}
            handleCancelBooking={handleCancelBooking}
          />
        ) : (
          renderListView()
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pemilihan Slot</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedSlot && (
              <div className="space-y-4">
                <p>Anda akan memesan slot wawancara berikut:</p>
                <Card className="p-4">
                  <h3 className="font-medium">{selectedSlot.title || "Slot Wawancara"}</h3>
                  <p className="text-sm mt-1">
                    <span className="text-gray-500">Tanggal:</span> {format(new Date(selectedSlot.start_time), "EEEE, d MMMM yyyy", { locale: id })}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Waktu:</span> {format(new Date(selectedSlot.start_time), "HH:mm")} - {format(new Date(selectedSlot.end_time), "HH:mm")}
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Pengurus IOM:</span> {selectedSlot.User.name}
                    {selectedSlot.Participants.length > 0 && (
                      <span className="ml-1 text-xs text-gray-600">
                        (+{selectedSlot.Participants.length} others)
                      </span>
                    )}
                  </p>
                </Card>
                <p className="text-sm text-gray-500">
                  Anda dapat membatalkan pemesanan ini nanti jika jadwal Anda berubah.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleBookSlot} 
              disabled={isLoading}
              className="bg-var hover:bg-var/90"
            >
              {isLoading ? "Memproses..." : "Konfirmasi Pemesanan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}