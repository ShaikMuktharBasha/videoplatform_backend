import Photo from '../models/Photo.js';
import User from '../models/User.js';
import { processPhoto } from '../services/photoProcessor.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload photo
export const uploadPhotoController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo file uploaded' });
    }
    
    const { title, description } = req.body;
    
    if (!title) {
      // Cleanup locally if validation fails
      try {
        if (!req.file.path.startsWith('http')) {
           fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        console.error('Error deleting file cleanup:', err);
      }
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Create photo record
    const photo = await Photo.create({
      title,
      description: description || '',
      filename: req.file.filename,
      filepath: req.file.path,
      filesize: req.file.size,
      mimetype: req.file.mimetype,
      user: req.user._id,
      processingStatus: 'completed', // Photos are usually ready immediately
      sensitivityStatus: 'pending'
    });
    
    // Start local sensitivity analysis
    processPhoto(photo._id);

    res.status(201).json({
      message: 'Photo uploaded successfully',
      photo: {
        id: photo._id,
        title: photo.title,
        description: photo.description,
        filename: photo.filename,
        filesize: photo.filesize,
        processingStatus: photo.processingStatus,
        sensitivityStatus: photo.sensitivityStatus
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up file if database operation fails
    if (req.file && !req.file.path.startsWith('http')) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({ message: 'Server error during upload', error: error.message });
  }
};

// Get all photos for current user
export const getUserPhotos = async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { user: req.user._id };
    if (status && ['safe', 'flagged', 'pending'].includes(status)) {
      query.sensitivityStatus = status;
    }
    
    const photos = await Photo.find(query)
      .sort({ createdAt: -1 });
    
    res.json({
      count: photos.length,
      photos
    });
  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({ message: 'Server error fetching photos', error: error.message });
  }
};

// Get all public photos
export const getAllPublicPhotos = async (req, res) => {
  try {
    const photos = await Photo.find({ sensitivityStatus: 'safe' })
      .sort({ createdAt: -1 })
      .populate('user', 'name');
    
    res.json({
      count: photos.length,
      photos
    });
  } catch (error) {
    console.error('Get public photos error:', error);
    res.status(500).json({ message: 'Server error fetching public photos', error: error.message });
  }
};

// Get single photo details
export const getPhotoById = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id).populate('user', 'name');
    
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    // Allow access if user owns photo OR photo is safe
    const isOwner = photo.user._id.toString() === req.user._id.toString();
    const isSafe = photo.sensitivityStatus === 'safe';

    if (!isOwner && !isSafe) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Add isSaved status
    let photoData = photo.toObject();
    if (req.user) {
        const currentUser = await User.findById(req.user._id);
        if (currentUser) {
            photoData.isSaved = currentUser.savedPhotos.includes(photo._id);
        }
    }

    res.json({ photo: photoData });
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ message: 'Server error fetching photo', error: error.message });
  }
};

// Delete photo
export const deletePhoto = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    // Check if user owns this photo or is Admin
    if (photo.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete from database
    await Photo.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ message: 'Server error deleting photo', error: error.message });
  }
};

// Get liked photos
export const getLikedPhotos = async (req, res) => {
  try {
    const photos = await Photo.find({ likes: req.user._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json({ photos });
  } catch (error) {
    console.error('Get liked photos error:', error);
    res.status(500).json({ message: 'Server error fetching liked photos' });
  }
};

// Get disliked photos
export const getDislikedPhotos = async (req, res) => {
  try {
    const photos = await Photo.find({ dislikes: req.user._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json({ photos });
  } catch (error) {
    console.error('Get disliked photos error:', error);
    res.status(500).json({ message: 'Server error fetching disliked photos' });
  }
};

// Get saved photos
export const getSavedPhotos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const photos = await Photo.find({ _id: { $in: user.savedPhotos } })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json({ photos });
  } catch (error) {
    console.error('Get saved photos error:', error);
    res.status(500).json({ message: 'Server error fetching saved photos' });
  }
};
