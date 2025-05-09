"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { PlusCircle, Calendar, Clock, User, Edit, Trash, UserPlus, UserMinus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";

// Types
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

export default function SlotListView() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [filter, setFilter] = useState("upcoming");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<SlotFormData>({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    studentCount: 1
  });

  // Fetch slots
  useEffect(() => {
    fetchSlots();
  }, []);

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

  const handleDeleteSlot = async (slotId: number) => {
    if (confirm("Are you sure you want to delete this slot?")) {
      try {
        const response = await fetch(`/api/slots/${slotId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Slot deleted successfully");
          fetchSlots();
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

  // Check if current user is owner or participant of a slot
  const isUserInvolvedInSlot = (slot: InterviewSlot) => {
    if (!session?.user?.id) return false;
    
    // Check if user is the owner
    if (slot.user_id === Number(session.user.id)) return true;
    
    // Check if user is a participant
    return slot.Participants.some(p => p.user_id === Number(session.user.id));
  };

  const isUserParticipantInSlot = (slot: InterviewSlot) => {
    if (!session?.user?.id) return false;
    
    // Check if there's a participant record with this user's ID
    return slot.Participants.some(p => p.user_id === Number(session.user.id));
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
      return format(slotDate, "yyyy-MM-dd") === selectedDate;
    }
    return true;
  });

  return (
    <>
      <div className="mb-6 flex items-center space-x-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter slots" />
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
            Buat Slot Baru
          </Button>
        </div>
      </div>
  
      {filteredSlots.length === 0 ? (
        <Card className="p-8 w-full text-center">
          <p className="text-gray-500">Tidak ada slot wawancara yang ditemukan.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSlots.map((slot) => {
            const isOwner = slot.user_id === Number(session?.user?.id);
            const isParticipant = slot.Participants.some(p => p.user_id === Number(session?.user?.id));
            const isBooked = slot.student_id !== null;
            const isMyBooking = slot.student_id === Number(session?.user?.id);
            
            return (
                <Card key={slot.id} className="p-4 w-full shadow-sm hover:shadow-md transition-shadow duration-200" style={{ backgroundColor: isBooked ? 'rgba(156, 163, 175, 0.8)' : 'rgba(255, 255, 255, 0.9)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-800">{slot.title || "Slot Wawancara"}</h2>
                      {isOwner && (
                        <Badge className="bg-blue-500">Pembuat</Badge>
                      )}
                      {isParticipant && (
                        <Badge className="bg-green-500">Peserta</Badge>
                      )}
                      {isBooked && (
                        <Badge className="bg-yellow-500">Booked</Badge>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        {format(new Date(slot.start_time), "EEEE, d MMMM yyyy", { locale: id })}
                      </p>
                      <p className="text-sm flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        {format(new Date(slot.start_time), "HH:mm")} - {format(new Date(slot.end_time), "HH:mm")}
                      </p>
                      <p className="text-sm flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        {slot.User.name}
                      </p>
                      {slot.description && (
                        <p className="text-sm mt-2 text-gray-600">{slot.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {/* Participants section */}
                  {slot.Participants.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Participants: </span>
                      {slot.Participants.map((p, i) => (
                        <span key={p.id}>
                          {p.User.name}{i < slot.Participants.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Student who booked the slot */}
                  {slot.student_id && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Booked by: </span>
                      {slot.Student?.User.name || "Student"}
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex space-x-2 mt-3">
                    {isOwner && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditSlot(slot)}
                          className="border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-red-200 hover:border-red-300 hover:bg-red-50"
                          onClick={() => handleDeleteSlot(slot.id)}
                        >
                          <Trash className="h-4 w-4 text-red-600" />
                        </Button>
                        
                        {isBooked && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50"
                            onClick={() => handleCancelBooking(slot.id)}
                          >
                            Cancel Booking
                          </Button>
                        )}
                      </>
                    )}
                    
                    {!isOwner && !isBooked && (
                      isParticipant ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:border-red-300 hover:bg-red-50"
                          onClick={() => handleLeaveSlot(slot.id)}
                        >
                          <UserMinus className="h-4 w-4 mr-1" />
                          <span>Leave</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-500 border-green-200 hover:border-green-300 hover:bg-green-50"
                          onClick={() => handleJoinSlot(slot.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          <span>Join</span>
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
                    min="1"
                    value={formData.studentCount}
                    onChange={(e) => setFormData({ ...formData, studentCount: parseInt(e.target.value) || 1 })}
                    required
                  />
                  {formData.studentCount > 1 && formData.date && formData.startTime && formData.endTime && (
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
    </>
  );
}