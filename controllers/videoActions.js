// Toggle like on video
export const toggleLike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const userId = req.user._id;
    const isLiked = video.likes.includes(userId);

    if (isLiked) {
      video.likes.pull(userId);
    } else {
      video.likes.push(userId);
    }

    await video.save();

    res.json({
      likes: video.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: 'Server error toggling like' });
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
