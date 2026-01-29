import Photo from '../models/Photo.js';
import User from '../models/User.js';

// Toggle like on photo
export const toggleLike = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const userId = req.user._id;
    const isLiked = photo.likes.includes(userId);
    const isDisliked = photo.dislikes.includes(userId);

    if (isLiked) {
      photo.likes.pull(userId);
    } else {
      photo.likes.push(userId);
      // Remove from dislikes if present
      if (isDisliked) {
        photo.dislikes.pull(userId);
      }
    }

    await photo.save();

    res.json({
      likes: photo.likes.length,
      dislikes: photo.dislikes.length,
      isLiked: !isLiked,
      isDisliked: false
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Server error toggling like' });
  }
};

// Toggle dislike on photo
export const toggleDislike = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const userId = req.user._id;
    const isDisliked = photo.dislikes.includes(userId);
    const isLiked = photo.likes.includes(userId);

    if (isDisliked) {
      photo.dislikes.pull(userId);
    } else {
      photo.dislikes.push(userId);
      // Remove from likes if present
      if (isLiked) {
        photo.likes.pull(userId);
      }
    }

    await photo.save();

    res.json({
      likes: photo.likes.length,
      dislikes: photo.dislikes.length,
      isLiked: false,
      isDisliked: !isDisliked
    });
  } catch (error) {
    console.error('Dislike error:', error);
    res.status(500).json({ message: 'Server error toggling dislike' });
  }
};

// Toggle save photo
export const toggleSave = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const photoId = req.params.id;
    
    // Check if photo exists
    const photo = await Photo.findById(photoId);
    if (!photo) {
        return res.status(404).json({ message: 'Photo not found' });
    }

    const isSaved = user.savedPhotos.includes(photoId);

    if (isSaved) {
      user.savedPhotos.pull(photoId);
    } else {
      user.savedPhotos.push(photoId);
    }

    await user.save();

    res.json({
      isSaved: !isSaved
    });
  } catch (error) {
    console.error('Save photo error:', error);
    res.status(500).json({ message: 'Server error toggling save' });
  }
};

// Increment view count
export const incrementView = async (req, res) => {
  try {
    const photo = await Photo.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!photo) {
        return res.status(404).json({ message: 'Photo not found' });
    }
    res.json({ views: photo.views });
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ message: 'Server error incrementing view' });
  }
};
