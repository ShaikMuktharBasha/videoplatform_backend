import multer from 'multer';
import { storage } from '../config/cloudinary.js';

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

export default upload;
