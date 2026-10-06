const mongoose = require('mongoose');

const verificationEventSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      enum: ['project', 'internship', 'certificate', 'achievement', 'competition', 'activity'],
      required: true,
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      required: true,
      default: 'pending',
      index: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    reviewerComment: {
      type: String,
      trim: true,
      maxlength: 600,
      default: '',
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 600,
      default: '',
    },
    reviewedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

verificationEventSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

module.exports = mongoose.model('VerificationEvent', verificationEventSchema);
