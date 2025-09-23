const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  type: {
    type: String,
    enum: [
      'issue_created',
      'issue_assigned',
      'issue_status_changed',
      'issue_resolved',
      'comment_added',
      'upvote_received',
      'admin_message',
      'system_announcement'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  data: {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue'
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    metadata: mongoose.Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  channels: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date, default: null },
      error: String
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date, default: null },
      error: String
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date, default: null },
      error: String
    }
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ isActive: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.readAt = null;
  return this.save();
};

// Method to mark email as sent
notificationSchema.methods.markEmailSent = function(error = null) {
  this.channels.email.sent = true;
  this.channels.email.sentAt = new Date();
  if (error) {
    this.channels.email.error = error;
  }
  return this.save();
};

// Method to mark SMS as sent
notificationSchema.methods.markSMSSent = function(error = null) {
  this.channels.sms.sent = true;
  this.channels.sms.sentAt = new Date();
  if (error) {
    this.channels.sms.error = error;
  }
  return this.save();
};

// Method to mark push notification as sent
notificationSchema.methods.markPushSent = function(error = null) {
  this.channels.push.sent = true;
  this.channels.push.sentAt = new Date();
  if (error) {
    this.channels.push.error = error;
  }
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  return this.create({
    user: data.user,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data || {},
    priority: data.priority || 'medium',
    expiresAt: data.expiresAt || null
  });
};

// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function(userId, page = 1, limit = 20, unreadOnly = false) {
  const skip = (page - 1) * limit;
  const query = { user: userId, isActive: true };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  return this.find(query)
    .populate('data.issueId', 'title status')
    .populate('data.commentId', 'content')
    .populate('data.userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to get notification statistics
notificationSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), isActive: true } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
        byType: {
          $push: {
            type: '$type',
            isRead: '$isRead'
          }
        }
      }
    }
  ]);
};

// Static method to clean up old notifications
notificationSchema.statics.cleanup = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.updateMany(
    { 
      createdAt: { $lt: cutoffDate },
      isRead: true 
    },
    { isActive: false }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
