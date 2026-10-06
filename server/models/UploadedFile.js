const mongoose = require('mongoose');

const uploadedFileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    extension: {
      type: String,
      required: true,
      trim: true,
      maxlength: 16,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
      max: 5 * 1024 * 1024,
    },
    data: {
      type: Buffer,
      required: true,
    },
  },
  { timestamps: true }
);

uploadedFileSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('UploadedFile', uploadedFileSchema);
