import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BookingSlot, BookingFormData } from '@/types/booking';
import { bookingsService } from '@/lib/bookings';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Edit, Trash2, User, BookOpen } from 'lucide-react';

interface MyBookingsProps {
  bookings: BookingSlot[];
  onBookingUpdated: () => void;
}

export const MyBookings = ({ bookings, onBookingUpdated }: MyBookingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingBooking, setEditingBooking] = useState<BookingSlot | null>(null);
  const [editForm, setEditForm] = useState<BookingFormData>({
    date: '',
    startTime: '',
    endTime: '',
    title: '',
    bookedBy: '',
    email: '',
    department: ''
  });

  // Filter bookings for current user using user_id from the database
  const userBookings = bookings.filter(booking => {
    return booking.user_id === user?.id;
  });

  // Get upcoming bookings
  const upcomingBookings = userBookings
    .filter(booking => new Date(booking.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get past bookings
  const pastBookings = userBookings
    .filter(booking => new Date(booking.date) < new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleEditBooking = (booking: BookingSlot) => {
    setEditingBooking(booking);
    setEditForm({
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      title: booking.title,
      bookedBy: booking.bookedBy,
      email: booking.email || '',
      department: booking.department || ''
    });
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking || !user) return;

    try {
      await bookingsService.updateBooking(editingBooking.id, editForm, user.id);
      toast({
        title: "Booking Updated",
        description: "Your booking has been successfully updated.",
      });
      setEditingBooking(null);
      onBookingUpdated();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await bookingsService.deleteBooking(bookingId);
      toast({
        title: "Booking Deleted",
        description: "Your booking has been successfully cancelled.",
      });
      onBookingUpdated();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderBookingsList = (bookingsList: BookingSlot[], title: string, emptyMessage: string) => (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {title} ({bookingsList.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-3 pr-4">
            {bookingsList.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{emptyMessage}</p>
            ) : (
              bookingsList.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-card-foreground">{booking.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.date), 'PPP')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </p>
                      {booking.department && (
                        <Badge variant="secondary">{booking.department}</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBooking(booking)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete your booking "{booking.title}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteBooking(booking.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            My Bookings Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userBookings.length}</div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{upcomingBookings.length}</div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{pastBookings.length}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderBookingsList(upcomingBookings, "Upcoming Bookings", "No upcoming bookings")}
        {renderBookingsList(pastBookings, "Past Bookings", "No past bookings")}
      </div>

      {/* Edit Booking Dialog */}
      <Dialog open={editingBooking !== null} onOpenChange={() => setEditingBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Booking
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Event Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Enter event title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-time">Start Time</Label>
                <Input
                  id="edit-start-time"
                  type="time"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-end-time">End Time</Label>
                <Input
                  id="edit-end-time"
                  type="time"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-booked-by">Booked By</Label>
              <Input
                id="edit-booked-by"
                value={editForm.bookedBy}
                onChange={(e) => setEditForm({ ...editForm, bookedBy: e.target.value })}
                placeholder="Name of person booking"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email (Optional)</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Contact email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department (Optional)</Label>
              <Input
                id="edit-department"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                placeholder="Department or organization"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateBooking} className="flex-1">
                Update Booking
              </Button>
              <Button variant="outline" onClick={() => setEditingBooking(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};