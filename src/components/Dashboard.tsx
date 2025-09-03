import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
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
import { format, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Edit, Trash2, Settings, User, Building } from 'lucide-react';

interface DashboardProps {
  bookings: BookingSlot[];
  onBookingUpdated: () => void;
}

export const Dashboard = ({ bookings, onBookingUpdated }: DashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
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

  // Filter bookings for current user
  const userBookings = bookings.filter(booking => booking.email === user?.email);
  
  // Get bookings for selected date
  const selectedDateBookings = userBookings.filter(booking => 
    isSameDay(new Date(booking.date), selectedDate)
  );

  // Get upcoming bookings
  const upcomingBookings = userBookings
    .filter(booking => new Date(booking.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

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

  // Get dates that have bookings for calendar highlighting
  const bookedDates = userBookings.map(booking => new Date(booking.date));

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Bookings</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{userBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Total bookings made by you
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <CalendarIcon className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{upcomingBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Future bookings scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Meetings</CardTitle>
            <Clock className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{selectedDateBookings.length}</div>
            <p className="text-xs text-muted-foreground">
              Meetings for selected date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Monthly Calendar View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              modifiers={{
                booked: bookedDates
              }}
              modifiersStyles={{
                booked: { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }
              }}
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Selected: {format(selectedDate, 'PPPP')}</p>
              <p className="mt-1">Highlighted dates have your bookings</p>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Selected Date Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {selectedDateBookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No bookings for this date
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateBookings.map((booking) => (
                    <Dialog key={booking.id}>
                      <DialogTrigger asChild>
                        <div className="border rounded-lg p-3 bg-card cursor-pointer hover:bg-accent/10 transition-colors">
                          <h4 className="font-semibold text-sm text-card-foreground">{booking.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </p>
                          {booking.department && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {booking.department}
                            </Badge>
                          )}
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-primary" />
                            Booking Details
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg">{booking.title}</h3>
                            <p className="text-muted-foreground">
                              {format(new Date(booking.date), 'PPP')}
                            </p>
                            <p className="text-muted-foreground">
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <p><strong>Booked by:</strong> {booking.bookedBy}</p>
                            {booking.email && <p><strong>Email:</strong> {booking.email}</p>}
                            {booking.department && <p><strong>Department:</strong> {booking.department}</p>}
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBooking(booking)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="flex items-center gap-2">
                                  <Trash2 className="h-4 w-4" />
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
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Your Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming bookings</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 bg-card">
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
                    <div className="flex gap-2 pt-2">
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
                          <Button variant="destructive" size="sm" className="flex items-center gap-1">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Booking Dialog */}
      {editingBooking && (
        <Dialog open={!!editingBooking} onOpenChange={() => setEditingBooking(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Edit Booking
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({...editForm, endTime: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bookedBy">Booked By</Label>
                <Input
                  id="bookedBy"
                  value={editForm.bookedBy}
                  onChange={(e) => setEditForm({...editForm, bookedBy: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={editForm.department}
                  onChange={(e) => setEditForm({...editForm, department: e.target.value})}
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
      )}
    </div>
  );
};