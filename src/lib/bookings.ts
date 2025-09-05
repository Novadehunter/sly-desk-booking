import { supabase } from '@/integrations/supabase/client';
import { BookingSlot, BookingFormData } from '@/types/booking';

export const bookingsService = {
  async getBookings(): Promise<BookingSlot[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      return data?.map(booking => ({
        id: booking.id,
        date: booking.date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        title: booking.title,
        bookedBy: booking.booked_by,
        email: booking.email || undefined,
        department: booking.department || undefined,
        createdAt: booking.created_at,
        user_id: booking.user_id,
      })) || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  async addBooking(bookingData: BookingFormData, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          date: bookingData.date,
          start_time: bookingData.startTime,
          end_time: bookingData.endTime,
          title: bookingData.title,
          booked_by: bookingData.bookedBy,
          email: bookingData.email,
          department: bookingData.department,
          user_id: userId,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding booking:', error);
      throw error;
    }
  },

  async updateBooking(bookingId: string, bookingData: BookingFormData, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          date: bookingData.date,
          start_time: bookingData.startTime,
          end_time: bookingData.endTime,
          title: bookingData.title,
          booked_by: bookingData.bookedBy,
          email: bookingData.email,
          department: bookingData.department,
        })
        .eq('id', bookingId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  async deleteBooking(bookingId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  },

  checkTimeConflict(
    date: string,
    startTime: string,
    endTime: string,
    existingBookings: BookingSlot[]
  ): boolean {
    const newStart = new Date(`${date} ${startTime}`);
    const newEnd = new Date(`${date} ${endTime}`);

    return existingBookings.some(booking => {
      if (booking.date !== date) return false;

      const existingStart = new Date(`${booking.date} ${booking.startTime}`);
      const existingEnd = new Date(`${booking.date} ${booking.endTime}`);

      // Check if times overlap
      return (newStart < existingEnd && newEnd > existingStart);
    });
  }
};