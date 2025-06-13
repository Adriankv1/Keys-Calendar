import React, { useState, useEffect } from 'react';
import { TimeSlot } from '../types';
import { api } from '../services/api';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 12); // 12 to 24
const TIME_FORMAT = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

const AvailabilityOverview: React.FC = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  // Generate next 7 days
  useEffect(() => {
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });
    setSelectedDates(dates);
  }, []);

  useEffect(() => {
    if (selectedDates.length > 0) {
      loadTimeSlots(selectedDates);
    }
  }, [selectedDates]);

  const loadTimeSlots = async (dates: string[]) => {
    try {
      const allSlots: TimeSlot[] = [];
      for (const date of dates) {
        const slots = await api.getTimeSlots(date);
        allSlots.push(...slots);
      }
      setTimeSlots(allSlots);
    } catch (err) {
      setError('Failed to load time slots');
      console.error(err);
    }
  };

  const isEveryoneAvailable = (date: string, hour: number) => {
    const timeStr = TIME_FORMAT(hour);
    const availableUsers = new Set(
      timeSlots
        .filter(slot => 
          slot.date === date && 
          slot.start_time === timeStr
        )
        .map(slot => slot.user_id)
    );
    return availableUsers.size === 5; // We have 5 users total
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="card">
      <h2 className="text-center mb-4">Availability Overview</h2>
      {error && <div className="error-message">{error}</div>}
      
      <div className="overflow-x-auto">
        <table className="availability-grid">
          <thead>
            <tr>
              <th>Time</th>
              {selectedDates.map(date => (
                <th key={date}>{formatDate(date)}</th>
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
                    className={`availability-cell ${isEveryoneAvailable(date, hour) ? 'all-available' : 'not-available'}`}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AvailabilityOverview; 