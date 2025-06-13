import { supabase } from '../lib/supabase';

export interface TimeSlot {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  date: string;
  created_at: string;
}

export const api = {
  // Time slots
  async getTimeSlots(date: string): Promise<TimeSlot[]> {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('date', date);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async createTimeSlot(timeSlot: Omit<TimeSlot, 'id' | 'created_at'>): Promise<TimeSlot> {
    const { data, error } = await supabase
      .from('time_slots')
      .insert([timeSlot])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async updateTimeSlot(id: string, timeSlot: Partial<TimeSlot>): Promise<TimeSlot> {
    const { data, error } = await supabase
      .from('time_slots')
      .update(timeSlot)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async deleteTimeSlot(id: string): Promise<void> {
    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },
}; 