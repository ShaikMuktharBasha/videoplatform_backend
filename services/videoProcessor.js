import Video from '../models/Video.js';

// Simulated video processing with sensitivity analysis
export const processVideo = async (videoId) => {
  try {
    const video = await Video.findById(videoId);
    
    if (!video) {
      console.error('Video not found for processing:', videoId);
      return;
    }
    
    // Update status to processing
    video.processingStatus = 'processing';
    video.processingProgress = 0;
    await video.save();
    
    // Simulate processing with progress updates
    const totalSteps = 10;
    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      
      const progress = (i / totalSteps) * 100;
      video.processingProgress = progress;
      await video.save();
    }
    
    // Simulated sensitivity analysis
    // 70% chance of being safe, 30% chance of being flagged
    const isSafe = Math.random() < 0.7;
    video.sensitivityStatus = isSafe ? 'safe' : 'flagged';
    video.processingStatus = 'completed';
    video.processingProgress = 100;
    
    // Simulate getting video duration (random between 30-600 seconds)
    video.duration = Math.floor(Math.random() * 570) + 30;
    
    await video.save();
    
    console.log(`✅ Video processing completed: ${video.title} - ${video.sensitivityStatus}`);
  } catch (error) {
    console.error('Error processing video:', error);
    
    // Update video status to failed
    try {
      await Video.findByIdAndUpdate(videoId, {
        processingStatus: 'failed',
        processingProgress: 0
      });
    } catch (dbError) {
      console.error('Database error during error handling:', dbError);
    }
  }
};
