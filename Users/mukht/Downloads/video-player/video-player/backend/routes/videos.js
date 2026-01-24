import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  uploadVideo,
  getUserVideos,
  getAllPublicVideos,
  getAdultVideos,
  getVideoById,
  streamVideo,
  deleteVideo,
  getLikedVideos,
  getDislikedVideos,
  getSavedVideos
} from '../controllers/videoController.js';
import { 
  toggleLike, 
  toggleDislike, 
  toggleSave, 
  incrementView 
} from '../controllers/videoActions.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /api/videos/upload - Upload video (Editor or Admin only)
router.post('/upload', requireRole('Editor', 'Admin'), upload.single('video'), uploadVideo);

// GET /api/videos - Get all videos for current user
router.get('/', getUserVideos);

// GET /api/videos/public - Get all public videos (safe for all ages)
router.get('/public', getAllPublicVideos);

// GET /api/videos/adult - Get all 18+ videos (mature content)
router.get('/adult', getAdultVideos);

// GET /api/videos/liked - Get liked videos
router.get('/liked', getLikedVideos);

// GET /api/videos/disliked - Get disliked videos
router.get('/disliked', getDislikedVideos);

// GET /api/videos/saved - Get saved videos
router.get('/saved', getSavedVideos);

// GET /api/videos/:id - Get single video details
router.get('/:id', getVideoById);

// GET /api/videos/stream/:id - Stream video
router.get('/stream/:id', streamVideo);

// POST /api/videos/:id/like - Toggle like
router.post('/:id/like', toggleLike);

// POST /api/videos/:id/dislike - Toggle dislike
router.post('/:id/dislike', toggleDislike);

// POST /api/videos/:id/save - Toggle save
router.post('/:id/save', toggleSave);

// POST /api/videos/:id/view - Increment view count
router.post('/:id/view', incrementView);

// DELETE /api/videos/:id - Delete video (Editor or Admin only)
router.delete('/:id', requireRole('Editor', 'Admin'), deleteVideo);

export default router;
