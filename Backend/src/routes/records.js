import express from 'express';
import Record from '../app/models/Record.js';

const router = express.Router();

// @route   GET /api/records
// @desc    Get all parking records
// @access  Public
router.get('/', async (req, res) => {
  try {
    // UPDATED: Sorts by `datetime` field to show the newest records first
    const records = await Record.find().sort({ datetime: -1 });
    res.json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ message: 'Server error while fetching records.' });
  }
});

export default router;
