const path = require('path');
const mongoose = require('mongoose');
const UploadedFile = require('../models/UploadedFile');

const toFileDTO = (fileDoc) => ({
  id: fileDoc._id,
  originalName: fileDoc.originalName,
  mimeType: fileDoc.mimeType,
  extension: fileDoc.extension,
  size: fileDoc.size,
  createdAt: fileDoc.createdAt,
});

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please choose a file to upload.' });
    }

    const extension = path.extname(req.file.originalname || '').toLowerCase();

    const createdFile = await UploadedFile.create({
      owner: req.user._id,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      extension,
      size: req.file.size,
      data: req.file.buffer,
    });

    return res.status(201).json({
      message: 'File uploaded successfully.',
      file: toFileDTO(createdFile),
    });
  } catch (error) {
    if (error.name === 'MulterError') {
      return res.status(400).json({ message: error.message });
    }

    if (error.message && /Unsupported file type/i.test(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    return next(error);
  }
};

exports.getFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid file ID.' });
    }

    const fileDoc = await UploadedFile.findOne({ _id: id, owner: req.user._id });

    if (!fileDoc) {
      return res.status(404).json({ message: 'File not found.' });
    }

    res.setHeader('Content-Type', fileDoc.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileDoc.originalName)}"`);
    return res.status(200).send(fileDoc.data);
  } catch (error) {
    return next(error);
  }
};

exports.deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid file ID.' });
    }

    const deleted = await UploadedFile.findOneAndDelete({ _id: id, owner: req.user._id });

    if (!deleted) {
      return res.status(404).json({ message: 'File not found.' });
    }

    return res.status(200).json({ message: 'File deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};

exports.ensureFileOwnedByUser = async (userId, fileId) => {
  if (!fileId) return null;

  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    const error = new Error('Invalid file ID.');
    error.statusCode = 400;
    throw error;
  }

  const fileDoc = await UploadedFile.findOne({ _id: fileId, owner: userId });

  if (!fileDoc) {
    const error = new Error('File does not exist or access is denied.');
    error.statusCode = 403;
    throw error;
  }

  return fileDoc;
};

exports.deleteOwnedFileSilently = async (userId, fileId) => {
  if (!fileId || !mongoose.Types.ObjectId.isValid(String(fileId))) {
    return;
  }

  await UploadedFile.findOneAndDelete({ _id: fileId, owner: userId });
};
