import express from 'express';
import Report from '../app/models/Report.js';
import requireAuth from '../middleware/auth/require-auth.js';

const router = express.Router();

// --- GET /api/reports ---
// Fetches a summary of all saved reports for the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const reports = await Report.find({ ownerId: req.user.id })
      .sort({ createdAt: -1 })
      .select('_id name createdAt type'); // Only select the fields needed for the list

    res.status(200).json({
      success: true,
      data: reports,
      message: 'Reports fetched successfully.'
    });

  } catch (error) {
    console.error("---! BACKEND CRASH in GET /api/reports !---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("The error object is:", error);
    console.error("---! END OF CRASH REPORT !---");

    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error. Check backend logs for details.' 
    });
  }
});

// --- GET /api/reports/:id ---
// Fetches the full details of a single report (only if owned by user)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findOne({ _id: id, ownerId: req.user.id });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    res.status(200).json({ success: true, data: report, message: 'Report details fetched successfully.' });

  } catch (error) {
    console.error(`---! BACKEND CRASH in GET /api/reports/${req.params.id} !---`);
    console.error("Timestamp:", new Date().toISOString());
    console.error("The error object is:", error);
    console.error("---! END OF CRASH REPORT !---");
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});


// --- POST /api/reports ---
// Creates a new report owned by the current user
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, areaId, type, chartData, filters, description } = req.body;

    // Basic validation
    if (!name || !areaId || !type || !chartData) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: name, areaId, type, and chartData are required.'
      });
    }

    const newReport = new Report({
      name,
      ownerId: req.user.id,
      areaId,
      type,
      chartData,
      filters,
      description
    });

    await newReport.save();
    res.status(201).json({ 
      success: true, 
      data: newReport, 
      message: 'Report saved successfully!' 
    });

  } catch (error) {
    console.error("---! BACKEND CRASH in POST /api/reports !---");
    console.error("Timestamp:", new Date().toISOString());
    console.error("The error object is:", error);
    console.error("---! END OF CRASH REPORT !---");
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});

// --- DELETE /api/reports/:id ---
// Deletes a report by its ID if owned by the current user
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReport = await Report.findOneAndDelete({ _id: id, ownerId: req.user.id });

    if (!deletedReport) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    res.status(200).json({ success: true, message: 'Report deleted successfully.' });
  
  } catch (error) {
    console.error(`---! BACKEND CRASH in DELETE /api/reports/${req.params.id} !---`);
    console.error("Timestamp:", new Date().toISOString());
    console.error("The error object is:", error);
    console.error("---! END OF CRASH REPORT !---");
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});


export default router;