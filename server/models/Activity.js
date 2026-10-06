const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: ['sports', 'cultural'],
      required: [true, 'Activity type is required.'],
      index: true,
    },
    activityName: {
      type: String,
      required: [true, 'Activity name is required.'],
      trim: true,
      maxlength: 180,
    },
    eventName: {
      type: String,
      required: [true, 'Event name is required.'],
      trim: true,
      maxlength: 180,
    },
    organization: {
      type: String,
      trim: true,
      maxlength: 180,
      default: '',
    },
    level: {
      type: String,
      enum: ['institution', 'district', 'state', 'national', 'international', 'other'],
      default: 'other',
    },
    role: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Activity date is required.'],
    },
    result: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: '',
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

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ user: 1, verificationStatus: 1, updatedAt: -1 });
activitySchema.index({ user: 1, activityType: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
