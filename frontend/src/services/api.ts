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

  async cleanupPastTimeSlots(): Promise<void> {
    // Get current date in Oslo timezone
    const now = new Date();
    const osloDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
    const todayStr = osloDate.toLocaleDateString('en-GB', {
      timeZone: 'Europe/Oslo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-');
    
    console.log('Current date in Oslo:', todayStr);

    // First, get all past time slots to log them
    const { data: pastSlots, error: fetchError } = await supabase
      .from('time_slots')
      .select('*')
      .lt('date', todayStr);

    if (fetchError) {
      console.error('Error fetching past slots:', fetchError);
      throw new Error(fetchError.message);
    }

    if (pastSlots && pastSlots.length > 0) {
      console.log('Found past time slots to delete:', pastSlots);
      
      // Delete each past slot individually to ensure proper deletion
      for (const slot of pastSlots) {
        const { error: deleteError } = await supabase
          .from('time_slots')
          .delete()
          .eq('id', slot.id);

        if (deleteError) {
          console.error('Error deleting slot:', slot.id, deleteError);
          throw new Error(deleteError.message);
        }
      }
      
      console.log('Successfully deleted all past time slots');
    } else {
      console.log('No past time slots found to clean up');
    }
  },
}; 