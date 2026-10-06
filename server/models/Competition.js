const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    competitionName: {
      type: String,
      required: [true, 'Competition name is required.'],
      trim: true,
      maxlength: 180,
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required.'],
      trim: true,
      maxlength: 180,
    },
    participationDate: {
      type: Date,
      required: [true, 'Participation date is required.'],
    },
    level: {
      type: String,
      enum: ['institution', 'district', 'state', 'national', 'international', 'other'],
      default: 'other',
    },
    result: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    position: {
      type: String,
      trim: true,
      maxlength: 80,
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

competitionSchema.index({ user: 1, createdAt: -1 });
competitionSchema.index({ user: 1, verificationStatus: 1, updatedAt: -1 });

module.exports = mongoose.model('Competition', competitionSchema);
