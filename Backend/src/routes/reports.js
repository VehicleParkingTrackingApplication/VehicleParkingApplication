import express from 'express';
import Report from '../app/models/Report.js';
import ReportShare from '../app/models/ReportShare.js';
import requireAuth from '../middleware/auth/require-auth.js';

const router = express.Router();

// --- GET /api/reports ---
// Fetches a summary of all saved reports for the current user (owned and shared)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('=== FETCHING REPORTS FOR USER ===');
    console.log('User ID:', userId);

    // Get owned reports
    const ownedReports = await Report.find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .select('_id name createdAt type ownerId');
    console.log('Owned reports count:', ownedReports.length);
    console.log('Owned reports:', ownedReports.map(r => ({ id: r._id, name: r.name })));

    // Get shared reports
    const sharedReportIds = await ReportShare.find({ sharedWith: userId })
      .select('reportId')
      .lean();
    console.log('Shared report IDs found:', sharedReportIds);

    const sharedReports = await Report.find({ 
      _id: { $in: sharedReportIds.map(share => share.reportId) }
    })
      .populate('ownerId', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .select('_id name createdAt type ownerId');
    console.log('Shared reports count:', sharedReports.length);
    console.log('Shared reports:', sharedReports.map(r => ({ id: r._id, name: r.name, owner: r.ownerId })));

    // Combine and format reports
    const allReports = [
      ...ownedReports.map(report => ({ ...report.toObject(), isOwner: true })),
      ...sharedReports.map(report => ({ ...report.toObject(), isOwner: false }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log('Total reports returned:', allReports.length);
    console.log('=== END FETCHING REPORTS ===');

    res.status(200).json({
      success: true,
      data: allReports,
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
// Fetches the full details of a single report (owned by user or shared with user)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user owns the report
    let report = await Report.findOne({ _id: id, ownerId: userId });

    // If not owned, check if it's shared with the user
    if (!report) {
      const share = await ReportShare.findOne({ reportId: id, sharedWith: userId });
      if (share) {
        report = await Report.findById(id);
      }
    }

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found or you do not have access to it.' });
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