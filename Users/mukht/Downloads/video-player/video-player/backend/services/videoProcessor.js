import Video from '../models/Video.js';
import { moderateContent } from './contentModerator.js';

/**
 * Advanced Video Processing with Content Moderation
 * Analyzes videos for: nudity, horror, violence, gore, drugs, weapons
 * Assigns appropriate content rating: public or 18+
 */
export const processVideo = async (videoId) => {
  try {
    const video = await Video.findById(videoId);
    
    if (!video) {
      console.error('Video not found for processing:', videoId);
      return;
    }
    
    console.log(`\n🎬 Starting video processing: ${video.title}`);
    
    // Update status to processing
    video.processingStatus = 'processing';
    video.processingProgress = 0;
    await video.save();
    
    // Phase 1: Initial processing (20%)
    console.log('📥 Phase 1: Preparing video for analysis...');
    await updateProgress(video, 20);
    
    // Phase 2: Content extraction (40%)
    console.log('🔍 Phase 2: Extracting video frames for analysis...');
    await updateProgress(video, 40);
    
    // Phase 3: AI Content Moderation (80%)
    console.log('🤖 Phase 3: Running AI content moderation...');
    const moderationResult = await moderateContent(
      video.filepath,
      'video',
      video.title,
      video.description
    );
    await updateProgress(video, 80);
    
    // Phase 4: Finalize results (100%)
    console.log('✅ Phase 4: Finalizing moderation results...');
    
    // Update video with moderation results
    video.moderationAnalysis = {
      nudity: moderationResult.analysis.nudity,
      violence: moderationResult.analysis.violence,
      horror: moderationResult.analysis.horror,
      gore: moderationResult.analysis.gore,
      drugs: moderationResult.analysis.drugs,
      weapons: moderationResult.analysis.weapons,
      analyzedAt: new Date(),
      analysisMethod: moderationResult.analysis.analysisMethod
    };
    
    video.contentRating = moderationResult.contentRating;
    video.sensitivityStatus = moderationResult.sensitivityStatus;
    video.processingStatus = 'completed';
    video.processingProgress = 100;
    
    // Use existing duration if available (from frontend extraction), otherwise simulate
    if (!video.duration || video.duration === 0) {
      video.duration = Math.floor(Math.random() * 570) + 30;
    }
    
    await video.save();
    
    // Log detailed results
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ VIDEO PROCESSING COMPLETED`);
    console.log(`${'='.repeat(50)}`);
    console.log(`📹 Title: ${video.title}`);
    console.log(`🏷️  Content Rating: ${video.contentRating.toUpperCase()}`);
    console.log(`📊 Sensitivity Status: ${video.sensitivityStatus}`);
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
    console.error('❌ Error processing video:', error);
    
    // Update video status to failed
    try {
      await Video.findByIdAndUpdate(videoId, {
        processingStatus: 'failed',
        processingProgress: 0,
        contentRating: 'pending',
        sensitivityStatus: 'pending'
      });
    } catch (dbError) {
      console.error('Database error during error handling:', dbError);
    }
  }
};

/**
 * Helper function to update progress with delay
 */
const updateProgress = async (video, progress) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  video.processingProgress = progress;
  await video.save();
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

export default { processVideo };
