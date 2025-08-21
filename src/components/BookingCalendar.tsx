import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Calendar, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingSlot } from '@/types/booking';
import { BookingForm } from './BookingForm';
import { cn } from '@/lib/utils';

interface BookingCalendarProps {
  bookings: BookingSlot[];
  onBookingAdded: () => void;
}

export const BookingCalendar = ({ bookings, onBookingAdded }: BookingCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  useEffect(() => {
    const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = Array.from({ length: 5 }, (_, i) => addDays(startOfCurrentWeek, i));
    setWeekDays(days);
  }, []);

  const getBookingsForDate = (date: Date): BookingSlot[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(booking => booking.date === dateStr);
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-primary rounded-xl p-6 shadow-header">
        <div className="flex items-center justify-between text-primary-foreground">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Ministry Auditorium</h1>
              <p className="text-primary-foreground/80">Weekly Booking System</p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowBookingForm(true)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {weekDays.map((day) => {
          const dayBookings = getBookingsForDate(day);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);

          return (
            <Card
              key={day.toISOString()}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:shadow-booking animate-fade-in",
                isToday && "ring-2 ring-accent",
                isSelected && "bg-booking-selected"
              )}
              onClick={() => setSelectedDate(day)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-center">
                  <div className="text-sm text-muted-foreground">
                    {format(day, 'EEE')}
                  </div>
                  <div className={cn(
                    "text-2xl font-bold",
                    isToday && "text-accent"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'MMM')}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayBookings.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="h-4 w-4 mx-auto mb-1" />
                    <p className="text-xs">Available</p>
                  </div>
                ) : (
                  dayBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-primary/10 rounded-lg p-2 animate-slide-up"
                    >
                      <div className="font-medium text-sm truncate" title={booking.title}>
                        {booking.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </div>
                      <div className="text-xs text-primary">
                        {booking.bookedBy}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selectedDate && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getBookingsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No bookings for this day</p>
                <p className="text-sm">The auditorium is available all day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getBookingsForDate(selectedDate).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 bg-gradient-card rounded-lg border animate-booking-bounce"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{booking.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Booked by: {booking.bookedBy}
                      </p>
                      {booking.department && (
                        <p className="text-xs text-muted-foreground">
                          Department: {booking.department}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-primary">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(booking.createdAt), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          isOpen={showBookingForm}
          onClose={() => setShowBookingForm(false)}
          onBookingAdded={onBookingAdded}
          preselectedDate={selectedDate}
          existingBookings={bookings}
        />
      )}
    </div>
  );
};