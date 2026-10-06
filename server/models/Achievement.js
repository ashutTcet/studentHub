const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Achievement title is required.'],
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: '',
    },
    category: {
      type: String,
      enum: ['academic', 'leadership', 'community', 'technical', 'sports', 'cultural', 'other'],
      default: 'other',
    },
    date: {
      type: Date,
      required: [true, 'Achievement date is required.'],
    },
    issuingOrganization: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
    },
    level: {
      type: String,
      enum: ['institution', 'district', 'state', 'national', 'international', 'other'],
      default: 'other',
    },
    evidenceFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UploadedFile',
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    verificationComment: {
      type: String,
      trim: true,
      maxlength: 600,
      default: '',
    },
    verificationRejectedReason: {
      type: String,
      trim: true,
      maxlength: 600,
      default: '',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

achievementSchema.index({ user: 1, createdAt: -1 });
achievementSchema.index({ user: 1, verificationStatus: 1, updatedAt: -1 });

module.exports = mongoose.model('Achievement', achievementSchema);
