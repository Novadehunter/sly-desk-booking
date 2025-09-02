-- Enable real-time for bookings table
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- Add bookings table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;