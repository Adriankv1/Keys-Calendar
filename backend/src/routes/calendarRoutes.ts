import express from 'express';
import { TimeSlot } from '../models/TimeSlot';

const router = express.Router();

// Get all time slots for a specific date
router.get('/:date', async (req, res) => {
  try {
    const timeSlots = await TimeSlot.find({ date: req.params.date })
      .populate('userId', 'name');
    res.json(timeSlots);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching time slots', error });
  }
});

// Create a new time slot
router.post('/', async (req, res) => {
  try {
    const { userId, startTime, endTime, date } = req.body;
    const timeSlot = new TimeSlot({ userId, startTime, endTime, date });
    await timeSlot.save();
    res.status(201).json(timeSlot);
  } catch (error) {
    res.status(400).json({ message: 'Error creating time slot', error });
  }
});

// Update a time slot
router.put('/:id', async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const timeSlot = await TimeSlot.findByIdAndUpdate(
      req.params.id,
      { startTime, endTime },
      { new: true }
    );
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }
    res.json(timeSlot);
  } catch (error) {
    res.status(400).json({ message: 'Error updating time slot', error });
  }
});

// Delete a time slot
router.delete('/:id', async (req, res) => {
  try {
    const timeSlot = await TimeSlot.findByIdAndDelete(req.params.id);
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }
    res.json({ message: 'Time slot deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting time slot', error });
  }
});

export const calendarRoutes = router; 