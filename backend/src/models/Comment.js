const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: [true, 'Issue reference is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isInternal: {
    type: Boolean,
    default: false
  },
  attachments: [{
    url: {
      type: String,
      required: true
    },
    publicId: String,
    name: String,
    type: String,
    size: Number
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
commentSchema.index({ issue: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ isDeleted: 1 });

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Method to like a comment
commentSchema.methods.like = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
    this.likesCount += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to unlike a comment
commentSchema.methods.unlike = function(userId) {
  const index = this.likes.indexOf(userId);
  if (index > -1) {
    this.likes.splice(index, 1);
    this.likesCount = Math.max(0, this.likesCount - 1);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to soft delete a comment
commentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = '[This comment has been deleted]';
  return this.save();
};

// Method to edit a comment
commentSchema.methods.edit = function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Pre-save middleware to update reply count
commentSchema.pre('save', function(next) {
  if (this.isNew && this.parentComment) {
    // This is a reply, update parent comment's replies array
    this.constructor.findByIdAndUpdate(
      this.parentComment,
      { $push: { replies: this._id } },
      { new: true }
    ).exec();
  }
  next();
});

// Static method to get comments for an issue
commentSchema.statics.getIssueComments = function(issueId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    issue: issueId,
    isDeleted: false,
    parentComment: null
  })
  .populate('author', 'name email profileImage role')
  .populate({
    path: 'replies',
    populate: {
      path: 'author',
      select: 'name email profileImage role'
    }
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get comment statistics
commentSchema.statics.getStats = function(issueId) {
  return this.aggregate([
    { $match: { issue: mongoose.Types.ObjectId(issueId), isDeleted: false } },
    {
      $group: {
        _id: null,
        totalComments: { $sum: 1 },
        totalLikes: { $sum: '$likesCount' },
        adminComments: { $sum: { $cond: ['$isAdmin', 1, 0] } },
        citizenComments: { $sum: { $cond: [{ $eq: ['$isAdmin', false] }, 1, 0] } }
      }
    }
  ]);
};

module.exports = mongoose.model('Comment', commentSchema);
