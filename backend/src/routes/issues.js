const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  validateIssueCreation,
  validateIssueUpdate,
  validateCommentCreation,
  validateObjectId,
  validatePagination,
  validateIssueFilters
} = require('../middleware/validation');

// Public routes (with optional auth for upvoting)
router.get('/', validateIssueFilters, validatePagination, optionalAuth, issueController.getIssues);
router.get('/nearby', issueController.getNearbyIssues);
router.get('/stats', issueController.getIssueStats);

// Protected routes
router.post('/', authenticate, validateIssueCreation, issueController.createIssue);
router.get('/:id', validateObjectId('id'), optionalAuth, issueController.getIssue);
router.put('/:id', authenticate, validateObjectId('id'), validateIssueUpdate, issueController.updateIssue);
router.delete('/:id', authenticate, validateObjectId('id'), issueController.deleteIssue);

// Upvoting
router.post('/:id/upvote', authenticate, validateObjectId('id'), issueController.upvoteIssue);
router.delete('/:id/upvote', authenticate, validateObjectId('id'), issueController.removeUpvote);

// Comments
router.get('/:id/comments', validateObjectId('id'), validatePagination, issueController.getIssueComments);
router.post('/:id/comments', authenticate, validateObjectId('id'), validateCommentCreation, issueController.addComment);

// User issues
router.get('/user/:userId', authenticate, validateObjectId('userId'), validatePagination, issueController.getUserIssues);

module.exports = router;
