const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required.'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1200,
      default: '',
    },
    technologies: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    projectType: {
      type: String,
      enum: ['academic', 'personal', 'freelance', 'research', 'open-source', 'other'],
      default: 'other',
    },
    startDate: {
      type: Date,
      required: [true, 'Project start date is required.'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    projectUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: '',
    },
    organization: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed', 'on-hold'],
      default: 'completed',
    },
    supportingFile: {
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

projectSchema.pre('save', function validateDates() {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    throw new Error('Project end date cannot be earlier than start date.');
  }
});

projectSchema.index({ user: 1, createdAt: -1 });
projectSchema.index({ user: 1, verificationStatus: 1, updatedAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
