const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Certificate title is required.'],
      trim: true,
      maxlength: 160,
    },
    issuingOrganization: {
      type: String,
      required: [true, 'Issuing organization is required.'],
      trim: true,
      maxlength: 160,
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required.'],
    },
    credentialId: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    credentialUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: '',
    },
    file: {
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

certificateSchema.index({ user: 1, createdAt: -1 });
certificateSchema.index({ user: 1, verificationStatus: 1, updatedAt: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);
