const mongoose = require('mongoose');
const AcademicRecord = require('../models/AcademicRecord');
const { invalidateByPattern } = require('../middleware/cache');

const parseOptionalNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }

  return parsed;
};

const normalizeAcademicYear = (value) => String(value || '').trim();

const isValidAcademicYear = (value) => {
  const match = /^(\d{4})-(\d{4})$/.exec(value);
  if (!match) return false;

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  return endYear === startYear + 1;
};

const validatePayload = (payload) => {
  const normalizedYear = normalizeAcademicYear(payload.academicYear);

  if (!normalizedYear) {
    throw new Error('Academic year is required.');
  }

  if (!isValidAcademicYear(normalizedYear)) {
    throw new Error('Academic year must be in YYYY-YYYY format (for example, 2025-2026).');
  }

  const semester = Number(payload.semester);
  if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
    throw new Error('Semester must be an integer between 1 and 12.');
  }

  const sgpa = parseOptionalNumber(payload.sgpa, 'SGPA');
  const cgpa = parseOptionalNumber(payload.cgpa, 'CGPA');
  const percentage = parseOptionalNumber(payload.percentage, 'Percentage');

  if (sgpa !== null && (sgpa < 0 || sgpa > 10)) {
    throw new Error('SGPA must be between 0 and 10.');
  }

  if (cgpa !== null && (cgpa < 0 || cgpa > 10)) {
    throw new Error('CGPA must be between 0 and 10.');
  }

  if (percentage !== null && (percentage < 0 || percentage > 100)) {
    throw new Error('Percentage must be between 0 and 100.');
  }

  const remarks = String(payload.remarks || '').trim();
  if (remarks.length > 300) {
    throw new Error('Remarks cannot exceed 300 characters.');
  }

  return {
    academicYear: normalizedYear,
    semester,
    sgpa,
    cgpa,
    percentage,
    remarks,
  };
};

exports.listAcademicRecords = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10));
    const query = { user: req.user._id };
    const [total, records] = await Promise.all([
      AcademicRecord.countDocuments(query),
      AcademicRecord.find(query)
        .lean()
        .sort({ academicYear: -1, semester: -1, createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
    ]);

    return res.status(200).json({
      records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        hasNextPage: page * pageSize < total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getAcademicRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid academic record ID.' });
    }

    const record = await AcademicRecord.findOne({ _id: id, user: req.user._id }).lean();

    if (!record) {
      return res.status(404).json({ message: 'Academic record not found.' });
    }

    return res.status(200).json({ record });
  } catch (error) {
    return next(error);
  }
};

exports.createAcademicRecord = async (req, res, next) => {
  try {
    const payload = validatePayload(req.body || {});

    const record = await AcademicRecord.create({
      user: req.user._id,
      ...payload,
    });

    await invalidateByPattern(`studenthub:dashboard:${req.user._id}:*`);

    return res.status(201).json({
      message: 'Academic record created successfully.',
      record,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A record for this academic year and semester already exists.' });
    }

    if (error.message && /required|must|cannot|valid/i.test(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    return next(error);
  }
};

exports.updateAcademicRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid academic record ID.' });
    }

    const payload = validatePayload(req.body || {});

    const existing = await AcademicRecord.findOne({ _id: id, user: req.user._id });
    if (!existing) {
      return res.status(404).json({ message: 'Academic record not found.' });
    }

    const expectedUpdatedAt = req.body?.expectedUpdatedAt ? new Date(req.body.expectedUpdatedAt) : null;
    if (expectedUpdatedAt && !Number.isNaN(expectedUpdatedAt.getTime()) && existing.updatedAt > expectedUpdatedAt) {
      return res.status(409).json({
        message: 'Conflict detected. The record has changed on the server.',
        conflict: true,
        serverRecord: existing,
      });
    }

    const record = await AcademicRecord.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: payload },
      { returnDocument: 'after', runValidators: true }
    );

    await invalidateByPattern(`studenthub:dashboard:${req.user._id}:*`);

    return res.status(200).json({
      message: 'Academic record updated successfully.',
      record,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A record for this academic year and semester already exists.' });
    }

    if (error.message && /required|must|cannot|valid/i.test(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    return next(error);
  }
};

exports.deleteAcademicRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid academic record ID.' });
    }

    const record = await AcademicRecord.findOneAndDelete({ _id: id, user: req.user._id });

    if (!record) {
      return res.status(404).json({ message: 'Academic record not found.' });
    }

    await invalidateByPattern(`studenthub:dashboard:${req.user._id}:*`);

    return res.status(200).json({ message: 'Academic record deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};
