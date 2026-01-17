import Photo from '../models/Photo.js';

// Simulated photo processing with sensitivity analysis
export const processPhoto = async (photoId) => {
  try {
    const photo = await Photo.findById(photoId);
    
    if (!photo) {
      console.error('Photo not found for processing:', photoId);
      return;
    }
    
    // Update status to processing
    photo.processingStatus = 'processing';
    photo.processingProgress = 0;
    await photo.save();
    
    // Simulate processing with progress updates (faster than video)
    const totalSteps = 5;
    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
      
      const progress = (i / totalSteps) * 100;
      photo.processingProgress = progress;
      await photo.save();
    }
    
    // Simulated sensitivity analysis
    // 80% chance of being safe, 20% chance of being flagged
    const isSafe = Math.random() < 0.8;
    photo.sensitivityStatus = isSafe ? 'safe' : 'flagged';
    photo.processingStatus = 'completed';
    photo.processingProgress = 100;
    
    await photo.save();
    
    console.log(`✅ Photo processing completed: ${photo.title} - ${photo.sensitivityStatus}`);
  } catch (error) {
    console.error('Error processing photo:', error);
    
    // Update photo status to failed
    try {
      await Photo.findByIdAndUpdate(photoId, {
        processingStatus: 'failed',
        processingProgress: 0
      });
    } catch (dbError) {
      console.error('Error updating photo failure status:', dbError);
    }
  }
};
