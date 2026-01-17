import Video from '../models/Video.js';
import User from '../models/User.js';
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
    
    const { title, description, duration } = req.body;
    
    if (!title) {
      // If validation fails, we can't easily delete from Cloudinary here without importing the uploader
      // But we must NOT allow fs.unlinkSync to crash the server if path is a URL
      try {
        if (!req.file.path.startsWith('http')) {
           fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        console.error('Error deleting file cleanup:', err);
      }
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Create video record
    // When using Cloudinary, req.file.path contains the remote URL
    const video = await Video.create({
      title,
      description: description || '',
      filename: req.file.filename, // This will be the Cloudinary Public ID
      filepath: req.file.path,     // This is the full Cloudinary URL
      filesize: req.file.size,
      mimetype: req.file.mimetype,
      duration: duration ? parseInt(duration) : 0, 
      user: req.user._id,
      processingStatus: 'completed', // Cloudinary handles processing instantly for basic playback
      sensitivityStatus: 'pending'   // We can keep this for our own moderation logic
    });
    
    // Start local sensitivity analysis (simulated)
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
      .sort({ createdAt: -1 });
    
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
    
    // Add isSaved status
    let videoData = video.toObject();
    if (req.user) {
        const currentUser = await User.findById(req.user._id);
        if (currentUser) {
            videoData.isSaved = currentUser.savedVideos.includes(video._id);
        }
    }

    res.json({ video: videoData });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ message: 'Server error fetching video', error: error.message });
  }
};

// Stream video with HTTP range requests
// NOTE: Cloudinary handles streaming. This endpoint is now a redirect or proxy.
// Efficient way: Redirect client to the full Cloudinary URL.
export const streamVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Redirect to the Cloudinary URL
    // Cloudinary URLs support streaming and range requests automatically
    res.redirect(video.filepath);
    
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
    
    // Delete file from Cloudinary (using filename as public_id)
    // Note: If you want proper deletion, import instance from cloudinary config
    // For now, we just delete the database record
    
    /* 
    // Example Cloudinary delete if you import cloudinary instance:
    import { cloudinary } from '../config/cloudinary.js';
    await cloudinary.uploader.destroy(video.filename, { resource_type: 'video' });
    */
    
    // Delete from database
    await Video.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Server error deleting video', error: error.message });
  }
};

// Get liked videos
export const getLikedVideos = async (req, res) => {
  try {
    const videos = await Video.find({ likes: req.user._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json({ videos });
  } catch (error) {
    console.error('Get liked videos error:', error);
    res.status(500).json({ message: 'Server error fetching liked videos' });
  }
};

// Get disliked videos
export const getDislikedVideos = async (req, res) => {
  try {
    const videos = await Video.find({ dislikes: req.user._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json({ videos });
  } catch (error) {
    console.error('Get disliked videos error:', error);
    res.status(500).json({ message: 'Server error fetching disliked videos' });
  }
};

// Get saved videos
export const getSavedVideos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const videos = await Video.find({ _id: { $in: user.savedVideos } })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json({ videos });
  } catch (error) {
    console.error('Get saved videos error:', error);
    res.status(500).json({ message: 'Server error fetching saved videos' });
  }
};
