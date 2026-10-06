const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    enrollmentNumber: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    department: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },
    course: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    academicYear: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    semester: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    linkedinUrl: {
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
    portfolioUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: '',
    },
    profilePhotoUrl: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: '',
    },
  },
  { timestamps: true }
);

studentProfileSchema.index({ department: 1, course: 1, academicYear: 1, semester: 1 });
studentProfileSchema.index({ enrollmentNumber: 1 }, { unique: true, sparse: true });
studentProfileSchema.index({ rollNumber: 1 }, { unique: true, sparse: true });
studentProfileSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
