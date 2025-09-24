import express from 'express';
import Report from '../app/models/Report.js';
import ReportShare from '../app/models/ReportShare.js';
import User from '../app/models/User.js';
import requireAuth from '../middleware/auth/require-auth.js';

const router = express.Router();

// --- GET /api/shares/:reportId ---
// Get all users that a report has been shared with
router.get('/:reportId', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    // Check if user is the owner of the report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    if (report.ownerId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the report owner can view sharing details.' 
      });
    }

    // Get all shares for this report with user details
    const shares = await ReportShare.find({ reportId })
      .populate('sharedWith', 'firstName lastName username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: shares,
      message: 'Share details fetched successfully.'
    });

  } catch (error) {
    console.error("Error fetching shares:", error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error.' 
    });
  }
});

// --- POST /api/shares ---
// Share a report with users in the same business
router.post('/', requireAuth, async (req, res) => {
  try {
    const { reportId, userIds } = req.body;
    const currentUserId = req.user.id;

    if (!reportId || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ 
        success: false,
        message: 'Report ID and user IDs array are required.' 
      });
    }

    // Check if user is the owner of the report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    if (report.ownerId.toString() !== currentUserId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the report owner can share the report.' 
      });
    }

    // Get current user's business ID
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const businessId = currentUser.businessId;

    // Verify all target users are in the same business
    const targetUsers = await User.find({ 
      _id: { $in: userIds },
      businessId: businessId 
    });

    if (targetUsers.length !== userIds.length) {
      return res.status(400).json({ 
        success: false,
        message: 'All users must be in the same business as you.' 
      });
    }

    // Create share records
    const sharePromises = userIds.map(async (targetUserId) => {
      // Check if already shared
      const existingShare = await ReportShare.findOne({
        reportId,
        sharedWith: targetUserId
      });

      if (!existingShare) {
        const newShare = new ReportShare({
          reportId,
          sharedBy: currentUserId,
          sharedWith: targetUserId,
          businessId
        });
        console.log('Creating new share:', {
          reportId,
          sharedBy: currentUserId,
          sharedWith: targetUserId,
          businessId
        });
        const savedShare = await newShare.save();
        console.log('Share created successfully:', savedShare._id);
        return savedShare;
      }
      console.log('Share already exists for user:', targetUserId);
      return existingShare;
    });

    const shares = await Promise.all(sharePromises);
    console.log('Created/updated shares count:', shares.length);

    // Update report's shared status
    await Report.findByIdAndUpdate(reportId, { isShared: true });
    console.log('Updated report shared status to true');

    res.status(201).json({ 
      success: true, 
      data: shares, 
      message: 'Report shared successfully.' 
    });

  } catch (error) {
    console.error("Error sharing report:", error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error.' 
    });
  }
});

// --- DELETE /api/shares/:shareId ---
// Remove a share (unshare the report with a user)
router.delete('/:shareId', requireAuth, async (req, res) => {
  try {
    const { shareId } = req.params;
    const userId = req.user.id;

    const share = await ReportShare.findById(shareId);
    if (!share) {
      return res.status(404).json({ success: false, message: 'Share not found.' });
    }

    // Check if user is the report owner
    const report = await Report.findById(share.reportId);
    if (report.ownerId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the report owner can remove shares.' 
      });
    }

    await ReportShare.findByIdAndDelete(shareId);

    // Check if there are any remaining shares for this report
    const remainingShares = await ReportShare.countDocuments({ reportId: share.reportId });
    if (remainingShares === 0) {
      await Report.findByIdAndUpdate(share.reportId, { isShared: false });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Share removed successfully.' 
    });

  } catch (error) {
    console.error("Error removing share:", error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error.' 
    });
  }
});

// --- GET /api/shares/business/users ---
// Get all users in the same business for sharing
router.get('/business/users', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user's business ID
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Get all users in the same business (excluding current user)
    const businessUsers = await User.find({ 
      businessId: currentUser.businessId,
      _id: { $ne: userId }
    }).select('firstName lastName username email');

    res.status(200).json({
      success: true,
      data: businessUsers,
      message: 'Business users fetched successfully.'
    });

  } catch (error) {
    console.error("Error fetching business users:", error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error.' 
    });
  }
});

export default router;
