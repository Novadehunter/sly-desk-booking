import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookingCalendar } from '@/components/BookingCalendar';
import { PostsList } from '@/components/PostsList';
import { BookingSlot } from '@/types/booking';
import { bookingsService } from '@/lib/bookings';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, Users, Clock, Calendar, LogOut, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const fetchedBookings = await bookingsService.getBookings();
      setBookings(fetchedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error Loading Bookings",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  // Redirect to auth if not logged in (after all hooks)
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const handleBookingAdded = () => {
    fetchBookings();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Statistics
  const todayBookings = bookings.filter(booking => {
    const today = new Date().toISOString().split('T')[0];
    return booking.date === today;
  }).length;

  const uniqueUsers = new Set(bookings.map(booking => booking.bookedBy)).size;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-primary">Loading Ministry Portal</h2>
          <p className="text-muted-foreground mt-2">Connecting to your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <div className="bg-gradient-primary shadow-header">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between text-primary-foreground">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">Ministry of Transport Portal</h1>
                <p className="text-primary-foreground/80 text-sm">Auditorium Booking & Updates</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-white text-primary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-primary-foreground hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-7xl">
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="bookings">Auditorium Bookings</TabsTrigger>
            <TabsTrigger value="updates">Ministry Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="bg-gradient-card shadow-card cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                      <Building className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{bookings.length}</div>
                      <p className="text-xs text-muted-foreground">
                        All time bookings - Click to view
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      All Bookings ({bookings.length})
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] w-full">
                    <div className="space-y-3 pr-4">
                      {bookings.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No bookings found</p>
                      ) : (
                        bookings.map((booking, index) => (
                          <div key={booking.id || index} className="border rounded-lg p-4 bg-card">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-semibold text-card-foreground">{booking.title}</h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(booking.date)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <span>By: <strong>{booking.bookedBy}</strong></span>
                                  {booking.department && (
                                    <Badge variant="secondary">{booking.department}</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="bg-gradient-card shadow-card cursor-pointer hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Today's Meetings</CardTitle>
                      <Clock className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-accent">{todayBookings}</div>
                      <p className="text-xs text-muted-foreground">
                        Active meetings today - Click to view
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-accent" />
                      Today's Meetings ({todayBookings})
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] w-full">
                    <div className="space-y-3 pr-4">
                      {bookings.filter(booking => {
                        const today = new Date().toISOString().split('T')[0];
                        return booking.date === today;
                      }).length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No meetings scheduled for today</p>
                      ) : (
                        bookings
                          .filter(booking => {
                            const today = new Date().toISOString().split('T')[0];
                            return booking.date === today;
                          })
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((booking, index) => (
                            <div key={booking.id || index} className="border rounded-lg p-4 bg-card">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <h4 className="font-semibold text-card-foreground">{booking.title}</h4>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span>By: <strong>{booking.bookedBy}</strong></span>
                                    {booking.department && (
                                      <Badge variant="secondary">{booking.department}</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              
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
          </TabsContent>

          <TabsContent value="updates">
            <PostsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;