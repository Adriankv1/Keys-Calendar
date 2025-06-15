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
    // Get current date in Oslo timezone to ensure consistent date handling across timezones
    const now = new Date();
    const osloDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
    const todayStr = osloDate.toLocaleDateString('en-GB', {
      timeZone: 'Europe/Oslo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split('/').reverse().join('-');
    
    console.log('Current date in Oslo:', todayStr);

    // Fetch all time slots that are in the past relative to Oslo time
    const { data: pastSlots, error: fetchError } = await supabase
      .from('time_slots')
      .select('*')
      .lt('date', todayStr);

    if (fetchError) {
      console.error('Error fetching past slots:', fetchError);
      throw new Error(fetchError.message);
    }

    if (pastSlots && pastSlots.length > 0) {
      console.log('Found past time slots to transfer:', pastSlots);
      
      // Group slots by date to handle each day's slots together
      // This ensures we maintain the relationship between slots on the same day
      const slotsByDate = pastSlots.reduce((acc: { [key: string]: TimeSlot[] }, slot) => {
        if (!acc[slot.date]) {
          acc[slot.date] = [];
        }
        acc[slot.date].push(slot);
        return acc;
      }, {});

      // Process each past date's slots
      // For each date, we:
      // 1. Calculate the corresponding date next week
      // 2. Create new slots for next week
      // 3. Delete the old slots
      for (const [date, slots] of Object.entries(slotsByDate)) {
        const pastDate = new Date(date);
        const nextWeekDate = new Date(pastDate);
        nextWeekDate.setDate(pastDate.getDate() + 7);
        const nextWeekDateStr = nextWeekDate.toISOString().split('T')[0];

        // Create new slots for next week, preserving all user selections and time slots
        const newSlots = slots.map(slot => ({
          user_id: slot.user_id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          date: nextWeekDateStr
        }));

        // Insert new slots first to ensure we don't lose data if deletion fails
        const { error: insertError } = await supabase
          .from('time_slots')
          .insert(newSlots);

        if (insertError) {
          console.error('Error inserting new slots:', insertError);
          throw new Error(insertError.message);
        }

        // Only delete old slots after successful insertion
        for (const slot of slots) {
          const { error: deleteError } = await supabase
            .from('time_slots')
            .delete()
            .eq('id', slot.id);

          if (deleteError) {
            console.error('Error deleting slot:', slot.id, deleteError);
            throw new Error(deleteError.message);
          }
        }
      }
      
      console.log('Successfully transferred all past time slots to next week');
    } else {
      console.log('No past time slots found to transfer');
    }
  },

  async transferTimeSlots(fromDate: string, toDate: string): Promise<void> {
    // Get all time slots for the source date
    const { data: sourceSlots, error: fetchError } = await supabase
      .from('time_slots')
      .select('*')
      .eq('date', fromDate);

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!sourceSlots || sourceSlots.length === 0) {
      return; // No slots to transfer
    }

    // Create new time slots for the target date
    const newSlots = sourceSlots.map(slot => ({
      user_id: slot.user_id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      date: toDate
    }));

    const { error: insertError } = await supabase
      .from('time_slots')
      .insert(newSlots);

    if (insertError) {
      throw new Error(insertError.message);
    }
  },
}; 