const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const ensureUploadsDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'];
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    ensureUploadsDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Maximum 5 files per request
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 10MB.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed per request.'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name in file upload.'
      });
    }
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

// Single file upload middleware
const uploadSingle = (fieldName) => [
  upload.single(fieldName),
  handleUploadError
];

// Multiple files upload middleware
const uploadMultiple = (fieldName, maxCount = 5) => [
  upload.array(fieldName, maxCount),
  handleUploadError
];

// Mixed files upload middleware
const uploadMixed = (fields) => [
  upload.fields(fields),
  handleUploadError
];

// Image upload middleware
const uploadImage = uploadSingle('image');

// Document upload middleware
const uploadDocument = uploadSingle('document');

// Multiple images upload middleware
const uploadImages = uploadMultiple('images', 5);

// Mixed upload middleware (images and documents)
const uploadMixedFiles = uploadMixed([
  { name: 'images', maxCount: 5 },
  { name: 'documents', maxCount: 3 }
]);

// Clean up uploaded files on error
const cleanupUploads = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If response is an error, clean up uploaded files
    if (res.statusCode >= 400) {
      if (req.file) {
        const filePath = path.join(__dirname, '../../uploads', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        files.forEach(file => {
          const filePath = path.join(__dirname, '../../uploads', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Validate file type based on field name
const validateFileType = (req, res, next) => {
  if (req.file) {
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const documentExtensions = ['.pdf', '.doc', '.docx'];
    
    // Check if it's an image field but file is not an image
    if (req.file.fieldname === 'image' && !imageExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed for image field'
      });
    }
    
    // Check if it's a document field but file is not a document
    if (req.file.fieldname === 'document' && !documentExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: 'Only document files are allowed for document field'
      });
    }
  }
  
  next();
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadMixed,
  uploadImage,
  uploadDocument,
  uploadImages,
  uploadMixedFiles,
  handleUploadError,
  cleanupUploads,
  validateFileType
};
