export interface User {
  id: string;
  name: string;
  email: string;
}

export interface TimeSlot {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  date: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string;
  userId: string;
}

export interface Availability {
  userId: string;
  userName: string;
  timeSlots: TimeSlot[];
} 