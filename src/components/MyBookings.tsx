import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { BookingSlot, BookingFormData } from '@/types/booking';
import { bookingsService } from '@/lib/bookings';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, Edit, Trash2, User, BookOpen, Building, Mail, AlertCircle } from 'lucide-react';

const editBookingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  bookedBy: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  department: z.string().optional(),
  date: z.string().min(1, 'Please select a date'),
  startTime: z.string().min(1, 'Please select start time'),
  endTime: z.string().min(1, 'Please select end time'),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return data.startTime < data.endTime;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

interface MyBookingsProps {
  bookings: BookingSlot[];
  onBookingUpdated: () => void;
}

export const MyBookings = ({ bookings, onBookingUpdated }: MyBookingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingBooking, setEditingBooking] = useState<BookingSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string>('');

  const form = useForm<BookingFormData>({
    resolver: zodResolver(editBookingSchema),
    defaultValues: {
      title: '',
      bookedBy: '',
      email: '',
      department: '',
      date: '',
      startTime: '',
      endTime: '',
    },
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

  // Generate time slots (8 AM to 6 PM)
  const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const hours = Math.floor(8 + i * 0.5);
    const minutes = (i * 0.5) % 1 === 0 ? '00' : '30';
    const time = `${hours.toString().padStart(2, '0')}:${minutes}`;
    const displayHours = hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const display = `${displayHours}:${minutes} ${ampm}`;
    return { value: time, label: display };
  });

  // Generate weekdays for the next 4 weeks
  const getWeekdayOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 28; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Only include weekdays (Monday to Friday)
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        options.push({
          value: format(date, 'yyyy-MM-dd'),
          label: format(date, 'EEEE, MMMM d')
        });
      }
    }
    
    return options;
  };

  const handleEditBooking = (booking: BookingSlot) => {
    setEditingBooking(booking);
    setConflictError('');
    
    // Pre-populate form with existing booking data
    form.reset({
      title: booking.title,
      bookedBy: booking.bookedBy,
      email: booking.email || '',
      department: booking.department || '',
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
    });
  };

  // Real-time conflict checking
  const checkConflictInRealTime = (data: BookingFormData) => {
    if (!data.date || !data.startTime || !data.endTime || !editingBooking) {
      setConflictError('');
      return;
    }

    // Filter out the current booking being edited from conflict check
    const otherBookings = bookings.filter(booking => booking.id !== editingBooking.id);
    
    const hasConflict = bookingsService.checkTimeConflict(
      data.date,
      data.startTime,
      data.endTime,
      otherBookings
    );

    if (hasConflict) {
      setConflictError('Selected time overlaps with another booking. Please choose a different time.');
    } else {
      setConflictError('');
    }
  };

  // Watch form values for real-time validation
  const watchedValues = form.watch();
  useEffect(() => {
    if (editingBooking) {
      checkConflictInRealTime(watchedValues);
    }
  }, [watchedValues.date, watchedValues.startTime, watchedValues.endTime, editingBooking, bookings]);

  const handleUpdateBooking = async (data: BookingFormData) => {
    if (!editingBooking || !user) return;

    setIsSubmitting(true);
    
    // Final conflict check before submission
    const otherBookings = bookings.filter(booking => booking.id !== editingBooking.id);
    const hasConflict = bookingsService.checkTimeConflict(
      data.date,
      data.startTime,
      data.endTime,
      otherBookings
    );

    if (hasConflict) {
      setConflictError('Selected time overlaps with another booking. Please choose a different time.');
      setIsSubmitting(false);
      return;
    }

    try {
      await bookingsService.updateBooking(editingBooking.id, data, user.id);
      toast({
        title: "Booking Updated",
        description: "Your booking has been successfully updated.",
      });
      setEditingBooking(null);
      setConflictError('');
      onBookingUpdated();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit className="h-6 w-6 text-primary" />
              Edit Booking
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateBooking)} className="space-y-6">
              {conflictError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{conflictError}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Meeting Title
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Ministry Planning Meeting"
                          className="focus:ring-accent"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bookedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Your Name
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Full Name"
                          className="focus:ring-accent"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="your.email@ministry.gov"
                          className="focus:ring-accent"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Branch/Department
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="focus:ring-accent">
                            <SelectValue placeholder="Select your branch/department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Planning">Planning</SelectItem>
                          <SelectItem value="Accounts">Accounts</SelectItem>
                          <SelectItem value="Development">Development</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Legal">Legal</SelectItem>
                          <SelectItem value="Secretary Office">Secretary Office</SelectItem>
                          <SelectItem value="Railway admin">Railway admin</SelectItem>
                          <SelectItem value="Internal Audit">Internal Audit</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Date
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="focus:ring-accent">
                            <SelectValue placeholder="Select a weekday" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getWeekdayOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Start Time
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="focus:ring-accent">
                            <SelectValue placeholder="Start time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        End Time
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="focus:ring-accent">
                            <SelectValue placeholder="End time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingBooking(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !!conflictError}
                  className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground"
                >
                  {isSubmitting ? 'Updating...' : 'Update Booking'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};