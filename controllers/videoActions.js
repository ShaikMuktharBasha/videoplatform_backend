import Video from '../models/Video.js';
import User from '../models/User.js';

// Toggle like on video
export const toggleLike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const userId = req.user._id;
    const isLiked = video.likes.includes(userId);
    const isDisliked = video.dislikes.includes(userId);

    if (isLiked) {
      video.likes.pull(userId);
    } else {
      video.likes.push(userId);
      // Remove from dislikes if present
      if (isDisliked) {
        video.dislikes.pull(userId);
      }
    }

    await video.save();

    res.json({
      likes: video.likes.length,
      dislikes: video.dislikes.length,
      isLiked: !isLiked,
      isDisliked: false
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Server error toggling like' });
  }
};

// Toggle dislike on video
export const toggleDislike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const userId = req.user._id;
    const isDisliked = video.dislikes.includes(userId);
    const isLiked = video.likes.includes(userId);

    if (isDisliked) {
      video.dislikes.pull(userId);
    } else {
      video.dislikes.push(userId);
      // Remove from likes if present
      if (isLiked) {
        video.likes.pull(userId);
      }
    }

    await video.save();

    res.json({
      likes: video.likes.length,
      dislikes: video.dislikes.length,
      isLiked: false,
      isDisliked: !isDisliked
    });
  } catch (error) {
    console.error('Dislike error:', error);
    res.status(500).json({ message: 'Server error toggling dislike' });
  }
};

// Toggle save video
export const toggleSave = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const videoId = req.params.id;
    
    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ message: 'Video not found' });
    }

    const isSaved = user.savedVideos.includes(videoId);

    if (isSaved) {
      user.savedVideos.pull(videoId);
    } else {
      user.savedVideos.push(videoId);
    }

    await user.save();

    res.json({
      isSaved: !isSaved
    });
  } catch (error) {
    console.error('Save video error:', error);
    res.status(500).json({ message: 'Server error toggling save' });
  }
};

// Increment view count
export const incrementView = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) {
        return res.status(404).json({ message: 'Video not found' });
    }
    res.json({ views: video.views });
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ message: 'Server error incrementing view' });
  }
};
