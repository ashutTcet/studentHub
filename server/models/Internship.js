const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: {
      type: String,
      required: [true, 'Organization is required.'],
      trim: true,
      maxlength: 120,
    },
    role: {
      type: String,
      required: [true, 'Role is required.'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: '',
    },
    internshipType: {
      type: String,
      enum: ['full-time', 'part-time', 'remote', 'hybrid', 'on-site', 'training', 'other'],
      default: 'other',
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    startDate: {
      type: Date,
      required: [true, 'Internship start date is required.'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    technologies: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed'],
      default: 'completed',
    },
    documentFile: {
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

internshipSchema.pre('save', function validateDates() {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    throw new Error('Internship end date cannot be earlier than start date.');
  }
});

internshipSchema.index({ user: 1, createdAt: -1 });
internshipSchema.index({ user: 1, verificationStatus: 1, updatedAt: -1 });

module.exports = mongoose.model('Internship', internshipSchema);
