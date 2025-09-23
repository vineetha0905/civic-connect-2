const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { authenticate } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// All notification routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const notifications = await notificationService.getUserNotifications(
      req.user._id,
      parseInt(page),
      parseInt(limit),
      unreadOnly === 'true'
    );

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting notifications',
      error: error.message
    });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(id, req.user._id);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking all notifications as read',
      error: error.message
    });
  }
});

// Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await notificationService.getNotificationStats(req.user._id);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting notification statistics',
      error: error.message
    });
  }
});

module.exports = router;
