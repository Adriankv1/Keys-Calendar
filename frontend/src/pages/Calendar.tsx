import React, { useState, useEffect } from 'react';
import { TimeSlot, Availability } from '../types';
import { api } from '../services/api';
import { getWeekDates } from '../components/AvailabilityOverview';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 12); // 12 to 24
const TIME_FORMAT = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

const USER_COLORS: { [key: string]: string } = {
  'Reen': '#6B46C1', // Deep Purple
  'Kris': '#E53E3E', // Red
  'Neeko': '#DD6B20', // Orange
  'Zela': '#D53F8C', // Pink
  'Zuju': '#4299E1', // Light Blue
};

const Calendar: React.FC = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [error, setError] = useState<string>('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Clean up past time slots when component mounts and when dates change
  // This ensures we don't show outdated data and automatically transfer past slots
  useEffect(() => {
    const cleanupPastSlots = async () => {
      try {
        console.log('Running cleanup for past time slots...');
        await api.cleanupPastTimeSlots();
        // Reload time slots after cleanup to show updated data
        if (selectedDates.length > 0) {
          await loadTimeSlots(selectedDates);
        }
      } catch (err) {
        console.error('Failed to cleanup past time slots:', err);
        setError('Failed to cleanup past time slots');
      }
    };
    cleanupPastSlots();
  }, [selectedDates]); // Run cleanup when dates change

  // Generate 7 days for the current week offset, starting on Wednesday
  useEffect(() => {
    setSelectedDates(getWeekDates(weekOffset));
  }, [weekOffset]);

  useEffect(() => {
    if (selectedDates.length > 0) {
      loadTimeSlots(selectedDates);
    }
  }, [selectedDates]);

  // Load and organize time slots for the selected dates
  // Groups slots by user and converts them to the availability format
  const loadTimeSlots = async (dates: string[]) => {
    try {
      const allSlots: TimeSlot[] = [];
      for (const date of dates) {
        const slots = await api.getTimeSlots(date);
        allSlots.push(...slots);
      }
      setTimeSlots(allSlots);
      
      // Group time slots by user for easier availability checking
      const groupedSlots = allSlots.reduce((acc: { [key: string]: TimeSlot[] }, slot) => {
        if (!acc[slot.user_id]) {
          acc[slot.user_id] = [];
        }
        acc[slot.user_id].push(slot);
        return acc;
      }, {});

      // Convert grouped slots to availability format for the UI
      const newAvailabilities = Object.entries(groupedSlots).map(([userId, slots]) => ({
        userId,
        userName: userId,
        timeSlots: slots
      }));

      setAvailabilities(newAvailabilities);
    } catch (err) {
      setError('Failed to load time slots');
      console.error(err);
    }
  };

  // Check if a date is in the past relative to Oslo time
  const isDateInPast = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    return date < today;
  };

  // Handle individual time slot selection/deselection
  // Toggles availability for a specific hour on a specific date
  const handleCellClick = async (date: string, hour: number) => {
    if (isDateInPast(date)) {
      setError('Cannot modify past dates');
      return;
    }

    const username = localStorage.getItem('username');
    if (!username) {
      setError('Please select your name first');
      return;
    }

    const timeStr = TIME_FORMAT(hour);
    const existingSlot = timeSlots.find(slot => 
      slot.user_id === username && 
      slot.date === date && 
      slot.start_time === timeStr
    );

    try {
      if (existingSlot) {
        // Remove the time slot if it exists
        await api.deleteTimeSlot(existingSlot.id);
        setTimeSlots(timeSlots.filter(slot => slot.id !== existingSlot.id));
        // Update availabilities to reflect the removal
        const userAvailability = availabilities.find(a => a.userId === username);
        if (userAvailability) {
          const updatedAvailabilities = availabilities.map(a =>
            a.userId === username
              ? { ...a, timeSlots: a.timeSlots.filter(slot => slot.id !== existingSlot.id) }
              : a
          );
          setAvailabilities(updatedAvailabilities);
        }
      } else {
        // Add a new time slot if it doesn't exist
        const newTimeSlot = await api.createTimeSlot({
          user_id: username,
          start_time: timeStr,
          end_time: TIME_FORMAT(hour + 1),
          date: date
        });
        setTimeSlots([...timeSlots, newTimeSlot]);
        // Update availabilities to include the new slot
        const userAvailability = availabilities.find(a => a.userId === username);
        if (userAvailability) {
          const updatedAvailabilities = availabilities.map(a =>
            a.userId === username
              ? { ...a, timeSlots: [...a.timeSlots, newTimeSlot] }
              : a
          );
          setAvailabilities(updatedAvailabilities);
        } else {
          setAvailabilities([
            ...availabilities,
            {
              userId: username,
              userName: username,
              timeSlots: [newTimeSlot]
            }
          ]);
        }
      }
      setError('');
    } catch (err) {
      setError('Failed to update time slot');
      console.error(err);
    }
  };

  // Handle entire day selection/deselection
  // Toggles availability for all hours on a specific date
  const handleDateClick = async (date: string) => {
    if (isDateInPast(date)) {
      setError('Cannot modify past dates');
      return;
    }

    const username = localStorage.getItem('username');
    if (!username) {
      setError('Please select your name first');
      return;
    }

    try {
      // Check if all times are already selected for this date
      const allTimesSelected = HOURS.every(hour => 
        isTimeSlotAvailable(date, hour, username)
      );

      if (allTimesSelected) {
        // Remove all time slots for this date if all are selected
        const slotsToRemove = timeSlots.filter(slot => 
          slot.user_id === username && slot.date === date
        );
        
        for (const slot of slotsToRemove) {
          await api.deleteTimeSlot(slot.id);
        }
        
        setTimeSlots(prevSlots => prevSlots.filter(slot => 
          !(slot.user_id === username && slot.date === date)
        ));

        // Update availabilities to reflect the removal
        setAvailabilities(prevAvailabilities => 
          prevAvailabilities.map(a => 
            a.userId === username 
              ? { 
                  ...a, 
                  timeSlots: a.timeSlots.filter(slot => slot.date !== date)
                }
              : a
          )
        );
      } else {
        // Add time slots for all hours if not all are selected
        const newSlots: TimeSlot[] = [];
        for (const hour of HOURS) {
          const timeStr = TIME_FORMAT(hour);
          const existingSlot = timeSlots.find(slot => 
            slot.user_id === username && 
            slot.date === date && 
            slot.start_time === timeStr
          );

          if (!existingSlot) {
            const newTimeSlot = await api.createTimeSlot({
              user_id: username,
              start_time: timeStr,
              end_time: TIME_FORMAT(hour + 1),
              date: date
            });
            newSlots.push(newTimeSlot);
          }
        }

        // Update time slots state with new slots
        setTimeSlots(prevSlots => [...prevSlots, ...newSlots]);

        // Update availabilities to include new slots
        setAvailabilities(prevAvailabilities => {
          const userAvailability = prevAvailabilities.find(a => a.userId === username);
          if (userAvailability) {
            return prevAvailabilities.map(a => 
              a.userId === username 
                ? { 
                    ...a, 
                    timeSlots: [...a.timeSlots, ...newSlots]
                  }
                : a
            );
          } else {
            return [
              ...prevAvailabilities,
              {
                userId: username,
                userName: username,
                timeSlots: newSlots
              }
            ];
          }
        });
      }
      setError('');
    } catch (err) {
      setError('Failed to update time slots');
      console.error(err);
    }
  };

  // Check if a specific time slot is available for a user
  const isTimeSlotAvailable = (date: string, hour: number, userId: string) => {
    const timeStr = TIME_FORMAT(hour);
    return timeSlots.some(slot => 
      slot.user_id === userId && 
      slot.date === date && 
      slot.start_time === timeStr
    );
  };

  // Check if all users are available for a specific time slot
  const isEveryoneAvailable = (date: string, hour: number) => {
    if (availabilities.length === 0) return false;
    return Object.keys(USER_COLORS).every(userId => 
      isTimeSlotAvailable(date, hour, userId)
    );
  };

  // Format date for display in the calendar header
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="text-center">Calendar</h1>
        {error && <div className="error-message">{error}</div>}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <button
            className="btn btn-secondary"
            onClick={() => setWeekOffset(weekOffset - 1)}
            disabled={weekOffset === 0}
          >
            Previous
          </button>
          <span style={{ fontWeight: 'bold', textAlign: 'center' }}>Week of {formatDate(selectedDates[0])}</span>
          <button
            className="btn btn-secondary"
            onClick={() => setWeekOffset(weekOffset + 1)}
          >
            Next
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="availability-grid">
            <thead>
              <tr>
                <th>Time</th>
                {selectedDates.map(date => (
                  <th 
                    key={date} 
                    className={`date-header ${isDateInPast(date) ? 'past-date' : ''}`}
                    onClick={() => !isDateInPast(date) && handleDateClick(date)}
                  >
                    {formatDate(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour}>
                  <td className="time-cell">{TIME_FORMAT(hour)}</td>
                  {selectedDates.map(date => (
                    <td 
                      key={`${date}-${hour}`} 
                      className={`availability-cell ${isEveryoneAvailable(date, hour) ? 'all-available' : ''} ${isDateInPast(date) ? 'past-date' : ''}`}
                      onClick={() => !isDateInPast(date) && handleCellClick(date, hour)}
                    >
                      {!isEveryoneAvailable(date, hour) && (
                        <div className="checkbox-grid">
                          {Object.entries(USER_COLORS).map(([userId, color]) => (
                            <div
                              key={userId}
                              className={`checkbox ${isTimeSlotAvailable(date, hour, userId) ? 'checked' : ''}`}
                              style={{ '--checkbox-color': color } as React.CSSProperties}
                              title={`${userId} - ${TIME_FORMAT(hour)}`}
                            />
                          ))}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 