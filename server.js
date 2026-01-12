import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import commentRoutes from './routes/comments.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import os from 'os';

// Serve static files (uploaded videos)
// Note: In Vercel this will not persist files, but we serve from os.tmpdir() to allow immediate playback
const uploadsPath = (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') 
  ? os.tmpdir() 
  : path.join(__dirname, 'uploads');
  
app.use('/uploads', express.static(uploadsPath));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Video Platform API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // Fallback for clients without /api prefix

app.use('/api/videos', videoRoutes);
app.use('/videos', videoRoutes); // Fallback

app.use('/api/videos/:videoId/comments', commentRoutes);
app.use('/videos/:videoId/comments', commentRoutes); // Fallback

app.use('/api/comments', commentRoutes);
app.use('/comments', commentRoutes); // Fallback

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Connect to Database
connectDB();

// Start server
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
       console.log(`🚀 Server running on port ${PORT}`);
    });
}

export default app;
