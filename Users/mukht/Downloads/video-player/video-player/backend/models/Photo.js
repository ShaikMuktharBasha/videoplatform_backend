import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
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
  // Processing fields for analysis
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingProgress: {
    type: Number,
    default: 0
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
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
photoSchema.index({ user: 1, createdAt: -1 });
photoSchema.index({ sensitivityStatus: 1 });
photoSchema.index({ contentRating: 1 });

const Photo = mongoose.model('Photo', photoSchema);

export default Photo;
