const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticate } = require('../middleware/auth');
const {
  uploadImage,
  uploadImages,
  uploadDocument,
  uploadMixedFiles,
  validateFileType,
  cleanupUploads
} = require('../middleware/upload');

// All upload routes require authentication
router.use(authenticate);

// Single file uploads
router.post('/image', uploadImage, validateFileType, cleanupUploads, uploadController.uploadImage);
router.post('/document', uploadDocument, validateFileType, cleanupUploads, uploadController.uploadDocument);

// Multiple file uploads
router.post('/images', uploadImages, cleanupUploads, uploadController.uploadImages);
router.post('/mixed', uploadMixedFiles, cleanupUploads, uploadController.uploadMixedFiles);

// File management
router.delete('/:publicId', uploadController.deleteFile);
router.get('/:publicId/info', uploadController.getFileInfo);
router.get('/:publicId/transform', uploadController.transformImage);

// Statistics
router.get('/stats', uploadController.getUploadStats);

module.exports = router;
