import { BookingSlot, BookingFormData } from '@/types/booking';

// Google Sheets configuration
const SHEET_ID = '1BcKq8Rw4vXgN2mP9sL7jE8hF3cD6aZ5t'; // Replace with your Google Sheet ID
const API_KEY = 'YOUR_GOOGLE_SHEETS_API_KEY'; // Replace with your API key
const RANGE = 'Bookings!A:H';

class SheetsService {
  private baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;

  async getBookings(): Promise<BookingSlot[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${RANGE}?key=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      
      if (!data.values || data.values.length <= 1) {
        return [];
      }
      
      // Skip header row and map data to BookingSlot objects
      return data.values.slice(1).map((row: string[], index: number) => ({
        id: row[0] || `booking-${index}`,
        date: row[1] || '',
        startTime: row[2] || '',
        endTime: row[3] || '',
        title: row[4] || '',
        bookedBy: row[5] || '',
        email: row[6] || '',
        department: row[7] || '',
        createdAt: row[8] || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Fallback to localStorage for development/testing
      return this.getLocalBookings();
    }
  }

  async addBooking(booking: BookingFormData): Promise<boolean> {
    const newBooking: BookingSlot = {
      id: `booking-${Date.now()}`,
      ...booking,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/${RANGE}:append?valueInputOption=RAW&key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [[
              newBooking.id,
              newBooking.date,
              newBooking.startTime,
              newBooking.endTime,
              newBooking.title,
              newBooking.bookedBy,
              newBooking.email || '',
              newBooking.department || '',
              newBooking.createdAt
            ]]
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add booking');
      }

      return true;
    } catch (error) {
      console.error('Error adding booking:', error);
      // Fallback to localStorage for development/testing
      this.addLocalBooking(newBooking);
      return true;
    }
  }

  // Fallback methods for local development
  private getLocalBookings(): BookingSlot[] {
    const bookings = localStorage.getItem('auditorium-bookings');
    return bookings ? JSON.parse(bookings) : [];
  }

  private addLocalBooking(booking: BookingSlot): void {
    const bookings = this.getLocalBookings();
    bookings.push(booking);
    localStorage.setItem('auditorium-bookings', JSON.stringify(bookings));
  }

  // Check for time conflicts
  checkTimeConflict(
    date: string, 
    startTime: string, 
    endTime: string, 
    bookings: BookingSlot[]
  ): boolean {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    return bookings.some(booking => {
      if (booking.date !== date) return false;
      
      const bookingStart = this.timeToMinutes(booking.startTime);
      const bookingEnd = this.timeToMinutes(booking.endTime);
      
      // Check for overlap
      return (start < bookingEnd && end > bookingStart);
    });
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export const sheetsService = new SheetsService();