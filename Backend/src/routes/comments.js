import express from 'express';
import Comment from '../app/models/Comment.js';
import Report from '../app/models/Report.js';
import ReportShare from '../app/models/ReportShare.js';
import User from '../app/models/User.js';
import requireAuth from '../middleware/auth/require-auth.js';

const router = express.Router();

// --- GET /api/comments/:reportId ---
// Get all comments for a specific report
router.get('/:reportId', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;

    // Check if user has access to this report (either owner or shared with them)
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    // Check if user is the owner or has been shared the report
    const isOwner = report.ownerId.toString() === userId;
    const isShared = await ReportShare.findOne({ 
      reportId: reportId, 
      sharedWith: userId 
    });

    if (!isOwner && !isShared) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to view this report.' 
      });
    }

    // Get comments with author information
    const comments = await Comment.find({ reportId })
      .populate('authorId', 'firstName lastName username')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: comments,
      message: 'Comments fetched successfully.'
    });

  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error.' 
    });
  }
});

// --- POST /api/comments ---
// Create a new comment
router.post('/', requireAuth, async (req, res) => {
  try {
    const { reportId, content } = req.body;
    const userId = req.user.id;

    if (!reportId || !content) {
      return res.status(400).json({ 
        success: false,
        message: 'Report ID and content are required.' 
      });
    }

    // Check if user has access to this report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const isOwner = report.ownerId.toString() === userId;
    const isShared = await ReportShare.findOne({ 
      reportId: reportId, 
      sharedWith: userId 
    });

    if (!isOwner && !isShared) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to comment on this report.' 
      });
    }

    const newComment = new Comment({
      reportId,
      authorId: userId,
      content: content.trim()
    });

    await newComment.save();
    await newComment.populate('authorId', 'firstName lastName username');

    res.status(201).json({ 
      success: true, 
      data: newComment, 
      message: 'Comment added successfully.' 
    });

  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error.' 
    });
  }
});

// --- PUT /api/comments/:id ---
// Update a comment (only by author)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
      return res.status(400).json({ 
        success: false,
        message: 'Content is required.' 
      });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    if (comment.authorId.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only edit your own comments.' 
      });
    }

    comment.content = content.trim();
    comment.updatedAt = Date.now();
    await comment.save();

    res.status(200).json({ 
      success: true, 
      data: comment, 
      message: 'Comment updated successfully.' 
    });

  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error.' 
    });
  }
});

// --- DELETE /api/comments/:id ---
// Delete a comment (only by author or report owner)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await Comment.findById(id).populate('reportId');
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const report = await Report.findById(comment.reportId);
    const isCommentAuthor = comment.authorId.toString() === userId;
    const isReportOwner = report.ownerId.toString() === userId;

    if (!isCommentAuthor && !isReportOwner) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own comments or be the report owner.' 
      });
    }

    await Comment.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true, 
      message: 'Comment deleted successfully.' 
    });

  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error.' 
    });
  }
});

export default router;
