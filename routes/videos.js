import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  uploadVideo,
  getUserVideos,
  getAllPublicVideos,
  getVideoById,
  streamVideo,
  deleteVideo
} from '../controllers/videoController.js';
import { toggleLike, incrementView } from '../controllers/videoActions.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /api/videos/upload - Upload video (Editor or Admin only)
router.post('/upload', requireRole('Editor', 'Admin'), upload.single('video'), uploadVideo);

// GET /api/videos - Get all videos for current user
router.get('/', getUserVideos);

// GET /api/videos/public - Get all public videos
router.get('/public', getAllPublicVideos);

// GET /api/videos/:id - Get single video details
router.get('/:id', getVideoById);

// GET /api/videos/stream/:id - Stream video
router.get('/stream/:id', streamVideo);

// POST /api/videos/:id/like - Toggle like
router.post('/:id/like', toggleLike);

// POST /api/videos/:id/view - Increment view count
router.post('/:id/view', incrementView);

// DELETE /api/videos/:id - Delete video (Editor or Admin only)
router.delete('/:id', requireRole('Editor', 'Admin'), deleteVideo);

export default router;
