import Video from '../models/Video.js';
import { processVideo } from '../services/videoProcessor.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload video
export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }
    
    const { title, description } = req.body;
    
    if (!title) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Create video record
    const video = await Video.create({
      title,
      description: description || '',
      filename: req.file.filename,
      filepath: req.file.path,
      filesize: req.file.size,
      mimetype: req.file.mimetype,
      user: req.user._id,
      processingStatus: 'pending',
      sensitivityStatus: 'pending'
    });
    
    // Start video processing
    processVideo(video._id);

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        filename: video.filename,
        filesize: video.filesize,
        processingStatus: video.processingStatus,
        sensitivityStatus: video.sensitivityStatus
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up file if database operation fails
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ message: 'Server error during upload', error: error.message });
  }
};

// Get all videos for current user (multi-tenant)
export const getUserVideos = async (req, res) => {
  try {
    const { status } = req.query; // Optional filter by sensitivity status
    
    const query = { user: req.user._id };
    if (status && ['safe', 'flagged', 'pending'].includes(status)) {
      query.sensitivityStatus = status;
    }
    
    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .select('-filepath'); // Don't expose file path
    
    res.json({
      count: videos.length,
      videos
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Server error fetching videos', error: error.message });
  }
};

// Get all public videos (safe status)
export const getAllPublicVideos = async (req, res) => {
  try {
    const videos = await Video.find({ sensitivityStatus: 'safe' })
      .sort({ createdAt: -1 })
      .select('-filepath')
      .populate('user', 'name'); // Populate uploader name
    
    res.json({
      count: videos.length,
      videos
    });
  } catch (error) {
    console.error('Get public videos error:', error);
    res.status(500).json({ message: 'Server error fetching public videos', error: error.message });
  }
};

// Get single video details
export const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate('user', 'name');
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Allow access if user owns video OR video is safe
    const isOwner = video.user._id.toString() === req.user._id.toString();
    const isSafe = video.sensitivityStatus === 'safe';

    if (!isOwner && !isSafe) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({ video });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ message: 'Server error fetching video', error: error.message });
  }
};

// Stream video with HTTP range requests
export const streamVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Allow access if user owns video OR video is safe
    const isOwner = video.user.toString() === req.user._id.toString();
    const isSafe = video.sensitivityStatus === 'safe';

    if (!isOwner && !isSafe) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const videoPath = video.filepath;
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.mimetype,
      };
      
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // No range, send entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.mimetype,
      };
      
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Stream video error:', error);
    res.status(500).json({ message: 'Server error streaming video', error: error.message });
  }
};

// Delete video
export const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if user owns this video or is Admin
    if (video.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete file from filesystem
    try {
      if (fs.existsSync(video.filepath)) {
        fs.unlinkSync(video.filepath);
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
    }
    
    // Delete from database
    await Video.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Server error deleting video', error: error.message });
  }
};
