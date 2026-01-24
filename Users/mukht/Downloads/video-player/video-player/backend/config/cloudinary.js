import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'video-platform',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm'],
    // Enable AI moderation for content analysis
    moderation: 'aws_rek',
  },
});

const photoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'video-platform/photos',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    // Enable AI moderation for content analysis
    moderation: 'aws_rek',
  },
});

export { cloudinary, storage, photoStorage };
