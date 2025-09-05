export interface BookingSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  bookedBy: string;
  email?: string;
  department?: string;
  createdAt: string;
  user_id: string;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  display: string;
}

export interface BookingFormData {
  title: string;
  bookedBy: string;
  email?: string;
  department?: string;
  date: string;
  startTime: string;
  endTime: string;
}