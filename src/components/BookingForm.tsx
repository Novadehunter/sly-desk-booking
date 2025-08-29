import { useState } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, User, Building, Mail, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookingSlot, BookingFormData } from '@/types/booking';
import { bookingsService } from '@/lib/bookings';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const bookingSchema = z.object({
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

interface BookingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingAdded: () => void;
  preselectedDate?: Date;
  existingBookings: BookingSlot[];
}

export const BookingForm = ({ 
  isOpen, 
  onClose, 
  onBookingAdded, 
  preselectedDate,
  existingBookings 
}: BookingFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      title: '',
      bookedBy: '',
      email: '',
      department: '',
      date: preselectedDate ? format(preselectedDate, 'yyyy-MM-dd') : '',
      startTime: '',
      endTime: '',
    },
  });

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

  const onSubmit = async (data: BookingFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be signed in to make a booking.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setConflictError('');

    // Check for time conflicts
    const hasConflict = bookingsService.checkTimeConflict(
      data.date,
      data.startTime,
      data.endTime,
      existingBookings
    );

    if (hasConflict) {
      setConflictError('This time slot conflicts with an existing booking. Please choose a different time.');
      setIsSubmitting(false);
      return;
    }

    try {
      const success = await bookingsService.addBooking(data, user.id);
      
      if (success) {
        toast({
          title: "Booking Confirmed",
          description: `${data.title} has been booked successfully.`,
        });
        onBookingAdded();
        onClose();
        form.reset();
      }
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-primary" />
            Book Auditorium
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <Calendar className="h-4 w-4" />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Calendar className="h-4 w-4" />
                      Date
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground"
              >
                {isSubmitting ? 'Creating...' : 'Book Auditorium'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};