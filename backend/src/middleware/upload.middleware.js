import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.fieldname === 'media') {
      if (file.mimetype.startsWith('image/')) {
        uploadPath += 'images/';
      } else if (file.mimetype.startsWith('video/')) {
        uploadPath += 'videos/';
      }
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImages = /jpeg|jpg|png|gif|webp/;
  const allowedVideos = /mp4/;
  
  const mimetype = file.mimetype;
  const ext = path.extname(file.originalname).toLowerCase().replace(/^\./, '');
  const extOk = allowedImages.test(ext) || (ext === '' && mimetype.startsWith('image/'));
  
  if (file.fieldname === 'avatar' || (file.fieldname === 'media' && mimetype.startsWith('image/'))) {
    if ((allowedImages.test(mimetype) || mimetype === 'image/webp') && extOk) {
      return cb(null, true);
    }
  } else if (file.fieldname === 'media' && mimetype.startsWith('video/')) {
    if (allowedVideos.test(mimetype)) {
      return cb(null, true);
    }
  }
  
  cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP images and MP4 videos are allowed.'));
};

// Upload middleware configurations
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const uploadContent = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB for videos, images use same limit
  }
});

// File size validation middleware
export const validateFileSize = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const maxSize = req.file.mimetype.startsWith('video/') 
    ? 50 * 1024 * 1024 // 50MB for videos
    : 5 * 1024 * 1024; // 5MB for images

  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: `File size exceeds limit. Maximum size is ${maxSize / 1024 / 1024}MB`
    });
  }

  next();
};
