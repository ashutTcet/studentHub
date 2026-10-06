const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required.'],
      trim: true,
      maxlength: 20,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required.'],
      min: [1, 'Semester must be at least 1.'],
      max: [12, 'Semester cannot be greater than 12.'],
    },
    sgpa: {
      type: Number,
      min: [0, 'SGPA cannot be negative.'],
      max: [10, 'SGPA cannot be greater than 10.'],
      default: null,
    },
    cgpa: {
      type: Number,
      min: [0, 'CGPA cannot be negative.'],
      max: [10, 'CGPA cannot be greater than 10.'],
      default: null,
    },
    percentage: {
      type: Number,
      min: [0, 'Percentage cannot be negative.'],
      max: [100, 'Percentage cannot be greater than 100.'],
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
  },
  { timestamps: true }
);

academicRecordSchema.index({ user: 1, academicYear: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('AcademicRecord', academicRecordSchema);
