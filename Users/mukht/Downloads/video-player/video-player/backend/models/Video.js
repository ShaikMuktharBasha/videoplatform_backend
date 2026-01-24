import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  filename: {
    type: String,
    required: true
  },
  filepath: {
    type: String,
    required: true
  },
  filesize: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  // Enhanced content rating system
  contentRating: {
    type: String,
    enum: ['public', '18+', 'restricted', 'pending'],
    default: 'pending'
  },
  sensitivityStatus: {
    type: String,
    enum: ['pending', 'safe', 'flagged', 'adult', 'horror', 'violence'],
    default: 'pending'
  },
  // Detailed moderation analysis results
  moderationAnalysis: {
    nudity: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 }
    },
    violence: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 }
    },
    horror: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 }
    },
    gore: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 }
    },
    drugs: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 }
    },
    weapons: {
      detected: { type: Boolean, default: false },
      confidence: { type: Number, default: 0 }
    },
    analyzedAt: { type: Date },
    analysisMethod: { type: String, default: 'cloudinary' }
  },
  processingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for faster queries
videoSchema.index({ user: 1, createdAt: -1 });
videoSchema.index({ sensitivityStatus: 1 });
videoSchema.index({ contentRating: 1 });

const Video = mongoose.model('Video', videoSchema);

export default Video;
