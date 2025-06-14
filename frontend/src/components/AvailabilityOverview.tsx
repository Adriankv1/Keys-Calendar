import React, { useState, useEffect } from 'react';
import { TimeSlot } from '../types';
import { api } from '../services/api';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 12); // 12 to 24
const TIME_FORMAT = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

// Utility to get the next 7 days starting from the most recent Wednesday
export function getWeekDates(weekOffset: number = 0): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Find the most recent Wednesday (or today if today is Wednesday)
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 3=Wed
  const daysSinceWednesday = (dayOfWeek + 4) % 7; // 0 if Wed, 1 if Thu, ...
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - daysSinceWednesday + weekOffset * 7);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    // Format as YYYY-MM-DD in local time
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }
  return dates;
}

interface AvailabilityOverviewProps {
  weekOffset: number;
  onWeekChange: (offset: number) => void;
}

const AvailabilityOverview: React.FC<AvailabilityOverviewProps> = ({ weekOffset, onWeekChange }) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const dates = getWeekDates(weekOffset);
    setSelectedDates(dates);
  }, [weekOffset]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button
          className="btn btn-secondary"
          onClick={() => onWeekChange(weekOffset - 1)}
          disabled={weekOffset === 0}
        >
          Previous
        </button>
        <span style={{ fontWeight: 'bold' }}>Week of {formatDate(selectedDates[0] || '')}</span>
        <button
          className="btn btn-secondary"
          onClick={() => onWeekChange(weekOffset + 1)}
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