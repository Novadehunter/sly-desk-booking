import { useState, useEffect } from 'react';
import { BookingCalendar } from '@/components/BookingCalendar';
import { BookingSlot } from '@/types/booking';
import { sheetsService } from '@/lib/sheets';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const fetchedBookings = await sheetsService.getBookings();
      setBookings(fetchedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error Loading Bookings",
        description: "Using local storage as fallback. Check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleBookingAdded = () => {
    fetchBookings();
  };

  // Statistics
  const totalBookings = bookings.length;
  const todayBookings = bookings.filter(booking => {
    const today = new Date().toISOString().split('T')[0];
    return booking.date === today;
  }).length;

  const uniqueUsers = new Set(bookings.map(booking => booking.bookedBy)).size;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-primary">Loading Auditorium Bookings</h2>
          <p className="text-muted-foreground mt-2">Connecting to booking system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Building className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                All time bookings
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Meetings</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{todayBookings}</div>
              <p className="text-xs text-muted-foreground">
                Active meetings today
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">
                Ministry staff using system
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Calendar */}
        <BookingCalendar 
          bookings={bookings} 
          onBookingAdded={handleBookingAdded}
        />
        
        {/* Setup Instructions */}
        {totalBookings === 0 && (
          <Card className="mt-8 bg-gradient-card shadow-card border-accent/20">
            <CardHeader>
              <CardTitle className="text-primary">Welcome to the Ministry of Transport Auditorium Book System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This system helps ministry officers book the auditorium for meetings and events during weekdays.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-primary">For Deployment & Google Sheets Integration:</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Create a Google Sheet with columns: ID, Date, StartTime, EndTime, Title, BookedBy, Email, Department, CreatedAt</li>
                  <li>Get a Google Sheets API key from Google Cloud Console</li>
                  <li>Update the SHEET_ID and API_KEY in src/lib/sheets.ts</li>
                  <li>Deploy to GitHub Pages for ministry-wide access</li>
                </ol>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Currently using local storage for testing. Click "New Booking" to add your first auditorium reservation!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;