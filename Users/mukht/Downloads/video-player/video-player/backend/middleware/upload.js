import multer from 'multer';
import { storage, photoStorage } from '../config/cloudinary.js';

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

export const uploadPhoto = multer({
  storage: photoStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for photos
  }
});

export const uploadVideo = upload;
export default upload;
