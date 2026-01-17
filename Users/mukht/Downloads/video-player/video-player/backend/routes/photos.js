import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadPhoto } from '../middleware/upload.js';
import {
  uploadPhotoController,
  getUserPhotos,
  getAllPublicPhotos,
  getPhotoById,
  deletePhoto,
  getLikedPhotos,
  getDislikedPhotos,
  getSavedPhotos
} from '../controllers/photoController.js';
import { 
  toggleLike, 
  toggleDislike, 
  toggleSave, 
  incrementView 
} from '../controllers/photoActions.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /api/photos/upload - Upload photo (Editor or Admin only)
router.post('/upload', requireRole('Editor', 'Admin'), uploadPhoto.single('photo'), uploadPhotoController);

// GET /api/photos - Get all photos for current user
router.get('/', getUserPhotos);

// GET /api/photos/public - Get all public photos
router.get('/public', getAllPublicPhotos);

// GET /api/photos/liked - Get liked photos
router.get('/liked', getLikedPhotos);

// GET /api/photos/disliked - Get disliked photos
router.get('/disliked', getDislikedPhotos);

// GET /api/photos/saved - Get saved photos
router.get('/saved', getSavedPhotos);

// GET /api/photos/:id - Get single photo details
router.get('/:id', getPhotoById);

// POST /api/photos/:id/like - Toggle like
router.post('/:id/like', toggleLike);

// POST /api/photos/:id/dislike - Toggle dislike
router.post('/:id/dislike', toggleDislike);

// POST /api/photos/:id/save - Toggle save
router.post('/:id/save', toggleSave);

// POST /api/photos/:id/view - Increment view count
router.post('/:id/view', incrementView);

// DELETE /api/photos/:id - Delete photo (Editor or Admin only)
router.delete('/:id', requireRole('Editor', 'Admin'), deletePhoto);

export default router;
