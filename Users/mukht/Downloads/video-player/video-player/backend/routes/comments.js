import express from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getComments,
  addComment,
  deleteComment
} from '../controllers/commentController.js';

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// GET /api/videos/:videoId/comments - Get comments for a video
// POST /api/videos/:videoId/comments - Add a comment
router.route('/')
  .get(getComments)
  .post(addComment);

// DELETE /api/comments/:id - Delete comment
router.delete('/:id', deleteComment);

export default router;
