const mongoose = require('mongoose');
const { ensureFileOwnedByUser, deleteOwnedFileSilently } = require('./fileController');
const { writeAuditLog } = require('../utils/auditLogger');
const { invalidateByPattern } = require('../middleware/cache');

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 30);
  }

  return [];
};

const isValidUrl = (raw) => {
  if (!raw || !String(raw).trim()) return true;

  try {
    const value = new URL(String(raw).trim());
    return value.protocol === 'http:' || value.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const defaultSanitize = (payload) => ({ ...payload });

const createOwnedCrudController = ({
  Model,
  allowedFields,
  fileField,
  sanitizePayload = defaultSanitize,
  listFilterBuilder,
  listSort,
  resourceType,
}) => {
  const pickAllowedFields = (input) => {
    const payload = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(input, field)) {
        payload[field] = input[field];
      }
    }

    return payload;
  };

  const list = async (req, res, next) => {
    try {
      const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
      const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10));
      const query = { user: req.user._id, ...(listFilterBuilder ? listFilterBuilder(req.query) : {}) };
      const [total, records] = await Promise.all([
        Model.countDocuments(query),
        Model.find(query)
          .lean()
          .sort(listSort || { createdAt: -1 })
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
        },
      });
    } catch (error) {
      return next(error);
    }
  };

  const getById = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid record ID.' });
      }

      const record = await Model.findOne({ _id: id, user: req.user._id });

      if (!record) {
        return res.status(404).json({ message: 'Record not found.' });
      }

      return res.status(200).json({ record: record.toObject ? record.toObject() : record });
    } catch (error) {
      return next(error);
    }
  };

  const create = async (req, res, next) => {
    try {
      const rawPayload = pickAllowedFields(req.body || {});
      const payload = sanitizePayload(rawPayload, normalizeStringArray, isValidUrl);

      if (fileField && payload[fileField]) {
        await ensureFileOwnedByUser(req.user._id, payload[fileField]);
      }

      const created = await Model.create({ ...payload, user: req.user._id });

      await writeAuditLog({
        req,
        actor: req.user,
        action: 'record.create',
        resourceType: resourceType || Model.modelName.toLowerCase(),
        resourceId: created._id,
      });

      return res.status(201).json({ message: 'Record created successfully.', record: created });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }

      if (error.message && /validation|required|cannot|must|Invalid|URL|date/i.test(error.message)) {
        return res.status(400).json({ message: error.message });
      }

      return next(error);
    }
  };

  const update = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid record ID.' });
      }

      const existing = await Model.findOne({ _id: id, user: req.user._id });

      if (!existing) {
        return res.status(404).json({ message: 'Record not found.' });
      }

      const expectedUpdatedAt = req.body?.expectedUpdatedAt ? new Date(req.body.expectedUpdatedAt) : null;
      if (expectedUpdatedAt && !Number.isNaN(expectedUpdatedAt.getTime()) && existing.updatedAt > expectedUpdatedAt) {
        return res.status(409).json({
          message: 'Conflict detected. The record has changed on the server.',
          conflict: true,
          serverRecord: existing,
        });
      }

      const rawPayload = pickAllowedFields(req.body || {});
      const payload = sanitizePayload(rawPayload, normalizeStringArray, isValidUrl);

      if (fileField && Object.prototype.hasOwnProperty.call(payload, fileField)) {
        if (payload[fileField]) {
          await ensureFileOwnedByUser(req.user._id, payload[fileField]);
        }

        const oldValue = existing[fileField] ? String(existing[fileField]) : null;
        const newValue = payload[fileField] ? String(payload[fileField]) : null;

        if (oldValue && oldValue !== newValue) {
          await deleteOwnedFileSilently(req.user._id, oldValue);
        }
      }

      Object.assign(existing, payload);

      // Any user edit moves the record back to pending verification.
      if (Object.keys(payload).length > 0 && Object.prototype.hasOwnProperty.call(existing, 'verificationStatus')) {
        existing.verificationStatus = 'pending';
        existing.verificationComment = '';
        existing.verificationRejectedReason = '';
        existing.verifiedBy = null;
        existing.verifiedAt = null;
      }

      const updated = await existing.save();

      await writeAuditLog({
        req,
        actor: req.user,
        action: 'record.update',
        resourceType: resourceType || Model.modelName.toLowerCase(),
        resourceId: updated._id,
      });

      await invalidateByPattern(`studenthub:dashboard:${req.user._id}:*`);

      await invalidateByPattern(`studenthub:dashboard:${req.user._id}:*`);

      return res.status(200).json({ message: 'Record updated successfully.', record: updated });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }

      if (error.message && /validation|required|cannot|must|Invalid|URL|date/i.test(error.message)) {
        return res.status(400).json({ message: error.message });
      }

      return next(error);
    }
  };

  const remove = async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid record ID.' });
      }

      const deleted = await Model.findOneAndDelete({ _id: id, user: req.user._id });

      if (!deleted) {
        return res.status(404).json({ message: 'Record not found.' });
      }

      if (fileField && deleted[fileField]) {
        await deleteOwnedFileSilently(req.user._id, deleted[fileField]);
      }

      await writeAuditLog({
        req,
        actor: req.user,
        action: 'record.delete',
        resourceType: resourceType || Model.modelName.toLowerCase(),
        resourceId: deleted._id,
      });

      await invalidateByPattern(`studenthub:dashboard:${req.user._id}:*`);

      return res.status(200).json({ message: 'Record deleted successfully.' });
    } catch (error) {
      return next(error);
    }
  };

  return { list, getById, create, update, patch: update, remove };
};

module.exports = { createOwnedCrudController, normalizeStringArray, isValidUrl };
