import Photo from '../models/Photo.js';
import User from '../models/User.js';
import { processPhoto } from '../services/photoProcessor.js';
import { generateSignedUpload } from '../config/cloudinary.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get upload signature for direct Cloudinary upload (bypasses Vercel's 4.5MB limit)
export const getPhotoUploadSignature = async (req, res) => {
  try {
    const signatureData = generateSignedUpload('image', 'video-platform/photos');
    res.json(signatureData);
  } catch (error) {
    console.error('Signature generation error:', error);
    res.status(500).json({ message: 'Error generating upload signature', error: error.message });
  }
};

// Save photo that was uploaded directly to Cloudinary
export const saveCloudinaryPhoto = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      cloudinaryUrl, 
      publicId, 
      filesize,
      format 
    } = req.body;
    
    if (!title || !cloudinaryUrl || !publicId) {
      return res.status(400).json({ 
        message: 'Title, cloudinaryUrl, and publicId are required' 
      });
    }
    
    // Create photo record from Cloudinary upload
    const photo = await Photo.create({
      title,
      description: description || '',
      filename: publicId,
      filepath: cloudinaryUrl,
      filesize: filesize || 0,
      mimetype: format ? `image/${format}` : 'image/jpeg',
      user: req.user._id,
      processingStatus: 'pending',
      sensitivityStatus: 'pending',
      contentRating: 'pending'
    });
    
    // Start content moderation analysis in background
    processPhoto(photo._id);
    
    res.status(201).json({
      message: 'Photo saved successfully',
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
    console.error('Save Cloudinary photo error:', error);
    res.status(500).json({ message: 'Error saving photo', error: error.message });
  }
};

// Upload photo (fallback for small files - Vercel has 4.5MB limit)
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
      processingStatus: 'pending',
      sensitivityStatus: 'pending',
      contentRating: 'pending'
    });
    
    // Start content moderation analysis in background
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

// Get all public photos (safe status with public content rating)
export const getAllPublicPhotos = async (req, res) => {
  try {
    // Only show photos that are safe AND have public content rating
    const photos = await Photo.find({ 
      contentRating: 'public',
      sensitivityStatus: 'safe',
      processingStatus: 'completed'
    })
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

// Get all 18+ photos (for adult users only - requires age verification)
export const getAdultPhotos = async (req, res) => {
  try {
    const photos = await Photo.find({ 
      contentRating: '18+',
      processingStatus: 'completed'
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name');
    
    res.json({
      count: photos.length,
      photos,
      warning: 'This content is rated 18+ and may contain nudity, horror, violence, or other mature content.'
    });
  } catch (error) {
    console.error('Get adult photos error:', error);
    res.status(500).json({ message: 'Server error fetching adult photos', error: error.message });
  }
};

// Get single photo details
export const getPhotoById = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id).populate('user', 'name');
    
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    // Allow access if user owns photo OR photo is public
    const isOwner = photo.user._id.toString() === req.user._id.toString();
    const isPublic = photo.contentRating === 'public' && photo.sensitivityStatus === 'safe';
    const isAdult = photo.contentRating === '18+';

    // Anyone can view public content, only owners can view restricted content
    if (!isOwner && !isPublic && !isAdult) {
      return res.status(403).json({ message: 'Access denied - Content is restricted' });
    }
    
    // Add isSaved status and content warning
    let photoData = photo.toObject();
    if (req.user) {
        const currentUser = await User.findById(req.user._id);
        if (currentUser) {
            photoData.isSaved = currentUser.savedPhotos.includes(photo._id);
        }
    }
    
    // Add content warning for 18+ content
    if (isAdult) {
      photoData.contentWarning = 'This content is rated 18+ and may contain mature content including nudity, horror, violence, or other sensitive material.';
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
