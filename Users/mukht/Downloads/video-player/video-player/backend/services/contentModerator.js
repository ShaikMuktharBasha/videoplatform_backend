import { cloudinary } from '../config/cloudinary.js';

/**
 * Advanced Content Moderation Service
 * Uses Cloudinary AI for content analysis and moderation
 * Detects: nudity, violence, horror, gore, drugs, weapons
 */

// Confidence thresholds for content classification
const THRESHOLDS = {
  NUDITY: 0.6,        // 60% confidence for nudity detection
  VIOLENCE: 0.5,      // 50% confidence for violence
  HORROR: 0.5,        // 50% confidence for horror/scary content
  GORE: 0.4,          // 40% confidence for gore (stricter)
  DRUGS: 0.5,         // 50% confidence for drugs
  WEAPONS: 0.4,       // 40% confidence for weapons
};

// Keywords that indicate horror/scary content in metadata or analysis
const HORROR_KEYWORDS = [
  'horror', 'scary', 'fear', 'terror', 'creepy', 'disturbing',
  'nightmare', 'demon', 'ghost', 'zombie', 'blood', 'dark',
  'sinister', 'evil', 'death', 'skull', 'monster', 'mutant'
];

// Keywords that indicate violence
const VIOLENCE_KEYWORDS = [
  'violence', 'fight', 'attack', 'weapon', 'gun', 'knife',
  'blood', 'injury', 'wound', 'combat', 'war', 'explosion'
];

/**
 * Analyze content using Cloudinary's AI moderation
 * @param {string} publicId - Cloudinary public ID of the asset
 * @param {string} resourceType - 'image' or 'video'
 * @returns {Object} Analysis results
 */
export const analyzeWithCloudinary = async (publicId, resourceType = 'image') => {
  try {
    // Get resource info with moderation data
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
      image_metadata: true,
      colors: true,
      faces: true,
      quality_analysis: true,
      moderation_status: true
    });

    // Extract moderation info if available
    const moderationInfo = result.moderation || [];
    const moderationAnalysis = {
      nudity: { detected: false, confidence: 0 },
      violence: { detected: false, confidence: 0 },
      horror: { detected: false, confidence: 0 },
      gore: { detected: false, confidence: 0 },
      drugs: { detected: false, confidence: 0 },
      weapons: { detected: false, confidence: 0 },
      raw: moderationInfo
    };

    // Process Cloudinary moderation results
    for (const mod of moderationInfo) {
      if (mod.kind === 'aws_rek' || mod.kind === 'google_video_intelligence') {
        // AWS Rekognition or Google Video Intelligence results
        if (mod.response && mod.response.moderation_labels) {
          for (const label of mod.response.moderation_labels) {
            const confidence = label.confidence / 100; // Convert to 0-1 scale
            const labelName = label.name?.toLowerCase() || '';
            
            if (labelName.includes('nudity') || labelName.includes('explicit')) {
              if (confidence > moderationAnalysis.nudity.confidence) {
                moderationAnalysis.nudity = { detected: confidence >= THRESHOLDS.NUDITY, confidence };
              }
            }
            if (labelName.includes('violence') || labelName.includes('graphic')) {
              if (confidence > moderationAnalysis.violence.confidence) {
                moderationAnalysis.violence = { detected: confidence >= THRESHOLDS.VIOLENCE, confidence };
              }
            }
            if (labelName.includes('gore') || labelName.includes('graphic_violence')) {
              if (confidence > moderationAnalysis.gore.confidence) {
                moderationAnalysis.gore = { detected: confidence >= THRESHOLDS.GORE, confidence };
              }
            }
            if (labelName.includes('drug') || labelName.includes('tobacco')) {
              if (confidence > moderationAnalysis.drugs.confidence) {
                moderationAnalysis.drugs = { detected: confidence >= THRESHOLDS.DRUGS, confidence };
              }
            }
            if (labelName.includes('weapon') || labelName.includes('gun') || labelName.includes('knife')) {
              if (confidence > moderationAnalysis.weapons.confidence) {
                moderationAnalysis.weapons = { detected: confidence >= THRESHOLDS.WEAPONS, confidence };
              }
            }
          }
        }
      }
    }

    return moderationAnalysis;
  } catch (error) {
    console.error('Cloudinary analysis error:', error);
    return null;
  }
};

/**
 * Analyze image/video colors for horror detection
 * Dark, red-heavy color schemes often indicate horror content
 */
export const analyzeColorsForHorror = (colors) => {
  if (!colors || !Array.isArray(colors)) return { detected: false, confidence: 0 };
  
  let darkColorCount = 0;
  let redBloodCount = 0;
  let totalWeight = 0;

  for (const [color, weight] of colors) {
    totalWeight += parseFloat(weight);
    
    // Parse RGB from hex color
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Check for dark colors (low brightness)
    const brightness = (r + g + b) / 3;
    if (brightness < 60) {
      darkColorCount += parseFloat(weight);
    }
    
    // Check for blood-red colors
    if (r > 150 && g < 80 && b < 80) {
      redBloodCount += parseFloat(weight);
    }
  }

  const darkRatio = darkColorCount / totalWeight;
  const redRatio = redBloodCount / totalWeight;
  
  // High dark ratio + red presence suggests horror
  const horrorScore = (darkRatio * 0.6) + (redRatio * 0.4);
  
  return {
    detected: horrorScore >= THRESHOLDS.HORROR,
    confidence: Math.min(horrorScore, 1)
  };
};

/**
 * Analyze text content (title, description) for sensitive keywords
 */
export const analyzeTextContent = (title, description = '') => {
  const combinedText = `${title} ${description}`.toLowerCase();
  
  const analysis = {
    horror: { detected: false, confidence: 0, matchedKeywords: [] },
    violence: { detected: false, confidence: 0, matchedKeywords: [] },
    adult: { detected: false, confidence: 0, matchedKeywords: [] }
  };

  // Check for horror keywords
  const horrorMatches = HORROR_KEYWORDS.filter(keyword => 
    combinedText.includes(keyword)
  );
  if (horrorMatches.length > 0) {
    const confidence = Math.min(horrorMatches.length * 0.2, 0.8);
    analysis.horror = {
      detected: confidence >= 0.4,
      confidence,
      matchedKeywords: horrorMatches
    };
  }

  // Check for violence keywords
  const violenceMatches = VIOLENCE_KEYWORDS.filter(keyword => 
    combinedText.includes(keyword)
  );
  if (violenceMatches.length > 0) {
    const confidence = Math.min(violenceMatches.length * 0.2, 0.8);
    analysis.violence = {
      detected: confidence >= 0.4,
      confidence,
      matchedKeywords: violenceMatches
    };
  }

  // Check for adult/NSFW keywords
  const adultKeywords = ['nsfw', '18+', 'adult', 'explicit', 'xxx', 'nude', 'naked', 'sex'];
  const adultMatches = adultKeywords.filter(keyword => 
    combinedText.includes(keyword)
  );
  if (adultMatches.length > 0) {
    analysis.adult = {
      detected: true,
      confidence: 0.9,
      matchedKeywords: adultMatches
    };
  }

  return analysis;
};

/**
 * Perform comprehensive content analysis
 * Combines multiple analysis methods for accurate detection
 */
export const performComprehensiveAnalysis = async (filepath, resourceType, title, description) => {
  const analysis = {
    nudity: { detected: false, confidence: 0 },
    violence: { detected: false, confidence: 0 },
    horror: { detected: false, confidence: 0 },
    gore: { detected: false, confidence: 0 },
    drugs: { detected: false, confidence: 0 },
    weapons: { detected: false, confidence: 0 },
    analyzedAt: new Date(),
    analysisMethod: 'comprehensive'
  };

  try {
    // 1. Text-based analysis (title and description)
    const textAnalysis = analyzeTextContent(title, description);
    
    // Merge text analysis results
    if (textAnalysis.horror.detected) {
      analysis.horror = textAnalysis.horror;
    }
    if (textAnalysis.violence.detected) {
      analysis.violence = textAnalysis.violence;
    }
    if (textAnalysis.adult.detected) {
      analysis.nudity = textAnalysis.adult;
    }

    // 2. Try Cloudinary AI analysis if we have a valid public ID
    if (filepath && filepath.includes('cloudinary')) {
      // Extract public ID from Cloudinary URL
      const publicIdMatch = filepath.match(/\/v\d+\/(.+?)(?:\.[a-z]+)?$/i);
      if (publicIdMatch) {
        const publicId = publicIdMatch[1];
        const cloudinaryAnalysis = await analyzeWithCloudinary(publicId, resourceType);
        
        if (cloudinaryAnalysis) {
          // Merge Cloudinary results (take higher confidence)
          for (const key of ['nudity', 'violence', 'gore', 'drugs', 'weapons']) {
            if (cloudinaryAnalysis[key]?.confidence > analysis[key].confidence) {
              analysis[key] = cloudinaryAnalysis[key];
            }
          }
        }
      }
    }

    // 3. Apply machine learning simulation for content without Cloudinary moderation
    // This simulates what a proper ML model would do
    if (!analysis.nudity.detected && !analysis.horror.detected && 
        !analysis.violence.detected && !analysis.gore.detected) {
      
      // Simulate ML analysis based on content patterns
      const mlSimulation = simulateMLAnalysis(title, description);
      
      for (const key of Object.keys(mlSimulation)) {
        if (mlSimulation[key].confidence > analysis[key].confidence) {
          analysis[key] = mlSimulation[key];
        }
      }
    }

  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    analysis.analysisMethod = 'fallback';
  }

  return analysis;
};

/**
 * Simulate ML-based content analysis
 * In production, this would be replaced with actual ML models like:
 * - TensorFlow NSFW detection
 * - Custom horror/violence classifiers
 * - Pre-trained content moderation models
 */
const simulateMLAnalysis = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  
  const results = {
    nudity: { detected: false, confidence: 0 },
    violence: { detected: false, confidence: 0 },
    horror: { detected: false, confidence: 0 },
    gore: { detected: false, confidence: 0 },
    drugs: { detected: false, confidence: 0 },
    weapons: { detected: false, confidence: 0 }
  };

  // Pattern-based detection (simulating ML output)
  const patterns = {
    nudity: /\b(nude|naked|nsfw|xxx|porn|explicit|sexy|bikini|underwear|lingerie)\b/i,
    violence: /\b(fight|kill|murder|attack|assault|blood|war|battle|shoot|stab)\b/i,
    horror: /\b(horror|scary|terror|creepy|ghost|demon|zombie|haunted|nightmare|dead|death)\b/i,
    gore: /\b(gore|gory|dismember|mutilat|decapitat|torture|brutal)\b/i,
    drugs: /\b(drug|cocaine|heroin|weed|marijuana|meth|pill|inject)\b/i,
    weapons: /\b(gun|rifle|pistol|sword|knife|weapon|bomb|explosive)\b/i
  };

  for (const [category, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern);
    if (matches) {
      const confidence = Math.min(0.6 + (matches.length * 0.1), 0.95);
      results[category] = {
        detected: confidence >= THRESHOLDS[category.toUpperCase()] || confidence >= 0.5,
        confidence
      };
    }
  }

  return results;
};

/**
 * Determine final content rating based on analysis
 */
export const determineContentRating = (analysis) => {
  // Check for adult content (18+)
  if (analysis.nudity?.detected || analysis.gore?.detected) {
    return {
      contentRating: '18+',
      sensitivityStatus: 'adult',
      reason: analysis.nudity?.detected ? 'Adult/NSFW content detected' : 'Gore content detected'
    };
  }

  // Check for horror content (18+)
  if (analysis.horror?.detected && analysis.horror.confidence >= 0.5) {
    return {
      contentRating: '18+',
      sensitivityStatus: 'horror',
      reason: 'Horror/scary content detected'
    };
  }

  // Check for violence (18+)
  if (analysis.violence?.detected && analysis.violence.confidence >= 0.6) {
    return {
      contentRating: '18+',
      sensitivityStatus: 'violence',
      reason: 'Violent content detected'
    };
  }

  // Check for drugs/weapons (restricted but not necessarily 18+)
  if (analysis.drugs?.detected || analysis.weapons?.detected) {
    // Lower confidence weapons/drugs might be okay
    const drugsConfidence = analysis.drugs?.confidence || 0;
    const weaponsConfidence = analysis.weapons?.confidence || 0;
    
    if (drugsConfidence >= 0.7 || weaponsConfidence >= 0.7) {
      return {
        contentRating: '18+',
        sensitivityStatus: 'flagged',
        reason: 'Drug or weapon content detected'
      };
    }
  }

  // Content is safe for public viewing
  return {
    contentRating: 'public',
    sensitivityStatus: 'safe',
    reason: 'No sensitive content detected'
  };
};

/**
 * Main moderation function to be called by processors
 */
export const moderateContent = async (filepath, resourceType, title, description) => {
  console.log(`🔍 Starting content moderation for: ${title}`);
  
  // Perform comprehensive analysis
  const analysis = await performComprehensiveAnalysis(filepath, resourceType, title, description);
  
  // Determine content rating
  const rating = determineContentRating(analysis);
  
  console.log(`📊 Moderation result: ${rating.contentRating} (${rating.sensitivityStatus})`);
  console.log(`   Reason: ${rating.reason}`);
  
  return {
    analysis,
    ...rating
  };
};

export default {
  moderateContent,
  analyzeWithCloudinary,
  analyzeTextContent,
  performComprehensiveAnalysis,
  determineContentRating
};
