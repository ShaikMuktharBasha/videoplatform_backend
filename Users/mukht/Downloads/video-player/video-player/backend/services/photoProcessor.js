import Photo from '../models/Photo.js';
import { moderateContent } from './contentModerator.js';

/**
 * Advanced Photo Processing with Content Moderation
 * Analyzes photos for: nudity, horror, violence, gore, drugs, weapons
 * Assigns appropriate content rating: public or 18+
 */
export const processPhoto = async (photoId) => {
  try {
    const photo = await Photo.findById(photoId);
    
    if (!photo) {
      console.error('Photo not found for processing:', photoId);
      return;
    }
    
    console.log(`\n📸 Starting photo processing: ${photo.title}`);
    
    // Update status to processing
    photo.processingStatus = 'processing';
    photo.processingProgress = 0;
    await photo.save();
    
    // Phase 1: Image preparation (25%)
    console.log('📥 Phase 1: Preparing image for analysis...');
    await updateProgress(photo, 25);
    
    // Phase 2: AI Content Moderation (75%)
    console.log('🤖 Phase 2: Running AI content moderation...');
    const moderationResult = await moderateContent(
      photo.filepath,
      'image',
      photo.title,
      photo.description
    );
    await updateProgress(photo, 75);
    
    // Phase 3: Finalize results (100%)
    console.log('✅ Phase 3: Finalizing moderation results...');
    
    // Update photo with moderation results
    photo.moderationAnalysis = {
      nudity: moderationResult.analysis.nudity,
      violence: moderationResult.analysis.violence,
      horror: moderationResult.analysis.horror,
      gore: moderationResult.analysis.gore,
      drugs: moderationResult.analysis.drugs,
      weapons: moderationResult.analysis.weapons,
      analyzedAt: new Date(),
      analysisMethod: moderationResult.analysis.analysisMethod
    };
    
    photo.contentRating = moderationResult.contentRating;
    photo.sensitivityStatus = moderationResult.sensitivityStatus;
    photo.processingStatus = 'completed';
    photo.processingProgress = 100;
    
    await photo.save();
    
    // Log detailed results
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ PHOTO PROCESSING COMPLETED`);
    console.log(`${'='.repeat(50)}`);
    console.log(`📷 Title: ${photo.title}`);
    console.log(`🏷️  Content Rating: ${photo.contentRating.toUpperCase()}`);
    console.log(`📊 Sensitivity Status: ${photo.sensitivityStatus}`);
    console.log(`💡 Reason: ${moderationResult.reason}`);
    console.log(`\n📈 Detection Results:`);
    console.log(`   • Nudity: ${formatDetection(moderationResult.analysis.nudity)}`);
    console.log(`   • Violence: ${formatDetection(moderationResult.analysis.violence)}`);
    console.log(`   • Horror: ${formatDetection(moderationResult.analysis.horror)}`);
    console.log(`   • Gore: ${formatDetection(moderationResult.analysis.gore)}`);
    console.log(`   • Drugs: ${formatDetection(moderationResult.analysis.drugs)}`);
    console.log(`   • Weapons: ${formatDetection(moderationResult.analysis.weapons)}`);
    console.log(`${'='.repeat(50)}\n`);
    
  } catch (error) {
    console.error('❌ Error processing photo:', error);
    
    // Update photo status to failed
    try {
      await Photo.findByIdAndUpdate(photoId, {
        processingStatus: 'failed',
        processingProgress: 0,
        contentRating: 'pending',
        sensitivityStatus: 'pending'
      });
    } catch (dbError) {
      console.error('Error updating photo failure status:', dbError);
    }
  }
};

/**
 * Helper function to update progress with delay
 */
const updateProgress = async (photo, progress) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  photo.processingProgress = progress;
  await photo.save();
};

/**
 * Format detection result for logging
 */
const formatDetection = (detection) => {
  if (!detection) return '❓ Not analyzed';
  const icon = detection.detected ? '⚠️' : '✅';
  const confidence = (detection.confidence * 100).toFixed(1);
  return `${icon} ${detection.detected ? 'DETECTED' : 'Clear'} (${confidence}% confidence)`;
};

export default { processPhoto };
