const mongoose = require('mongoose');
const Project = require('../models/Project');
const Internship = require('../models/Internship');
const Certificate = require('../models/Certificate');
const Achievement = require('../models/Achievement');
const Competition = require('../models/Competition');
const Activity = require('../models/Activity');
const User = require('../models/User');
const VerificationEvent = require('../models/VerificationEvent');
const { createNotification } = require('../utils/notificationService');
const { writeAuditLog } = require('../utils/auditLogger');
const { invalidateByPattern } = require('../middleware/cache');

const RESOURCE_MAP = {
  project: { model: Project, label: 'Project', title: (doc) => doc.title || 'Project' },
  internship: { model: Internship, label: 'Internship', title: (doc) => `${doc.organization || ''} ${doc.role || ''}`.trim() || 'Internship' },
  certificate: { model: Certificate, label: 'Certificate', title: (doc) => doc.title || 'Certificate' },
  achievement: { model: Achievement, label: 'Achievement', title: (doc) => doc.title || 'Achievement' },
  competition: { model: Competition, label: 'Competition', title: (doc) => doc.competitionName || 'Competition' },
  activity: { model: Activity, label: 'Activity', title: (doc) => doc.activityName || 'Activity' },
};

const ALLOWED_STATUSES = new Set(['pending', 'verified', 'rejected']);

const pickResource = (resourceType) => RESOURCE_MAP[resourceType] || null;

const buildQueueItem = (resourceType, record) => ({
  id: record._id,
  resourceType,
  resourceLabel: RESOURCE_MAP[resourceType].label,
  title: RESOURCE_MAP[resourceType].title(record),
  verificationStatus: record.verificationStatus,
  verificationComment: record.verificationComment || '',
  verificationRejectedReason: record.verificationRejectedReason || '',
  verifiedAt: record.verifiedAt,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  student: {
    id: record.user?._id,
    name: record.user?.name || '',
    email: record.user?.email || '',
  },
});

exports.getVerificationQueue = async (req, res, next) => {
  try {
    const status = ALLOWED_STATUSES.has(req.query.status) ? req.query.status : 'pending';
    const resourceTypeFilter = req.query.resourceType ? String(req.query.resourceType).trim().toLowerCase() : '';
    const search = String(req.query.search || '').trim().toLowerCase();
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10));

    const resourceTypes = resourceTypeFilter && pickResource(resourceTypeFilter)
      ? [resourceTypeFilter]
      : Object.keys(RESOURCE_MAP);

    const resultsPerType = await Promise.all(
      resourceTypes.map(async (resourceType) => {
        const { model } = RESOURCE_MAP[resourceType];
        const windowSize = Math.min(500, page * pageSize);
        const records = await model
          .find({ verificationStatus: status })
          .select('user verificationStatus verificationComment verificationRejectedReason verifiedAt createdAt updatedAt title organization role competitionName activityName')
          .lean()
          .populate('user', 'name email')
          .sort({ updatedAt: -1 })
          .limit(windowSize);

        return records
          .filter((record) => {
            if (!search) return true;
            const hay = `${record.user?.name || ''} ${record.user?.email || ''} ${RESOURCE_MAP[resourceType].title(record)}`.toLowerCase();
            return hay.includes(search);
          })
          .map((record) => buildQueueItem(resourceType, record));
      })
    );

    const merged = resultsPerType.flat().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const total = merged.length;
    const start = (page - 1) * pageSize;
    const records = merged.slice(start, start + pageSize);

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

exports.getVerificationRecordDetails = async (req, res, next) => {
  try {
    const { resourceType, id } = req.params;
    const resource = pickResource(resourceType);

    if (!resource) {
      return res.status(400).json({ message: 'Invalid resource type.' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid record ID.' });
    }

    const record = await resource.model.findById(id).populate('user', 'name email role');

    if (!record) {
      return res.status(404).json({ message: 'Record not found.' });
    }

    const verificationHistory = await VerificationEvent.find({
      resourceType,
      resourceId: record._id,
    })
      .populate('reviewer', 'name email role')
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      record: {
        ...record.toObject(),
        resourceType,
      },
      verificationHistory,
    });
  } catch (error) {
    return next(error);
  }
};

exports.reviewVerificationRecord = async (req, res, next) => {
  try {
    const { resourceType, id } = req.params;
    const { decision, comment, rejectionReason } = req.body || {};
    const resource = pickResource(resourceType);

    if (!resource) {
      return res.status(400).json({ message: 'Invalid resource type.' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid record ID.' });
    }

    if (decision !== 'verified' && decision !== 'rejected') {
      return res.status(400).json({ message: 'Decision must be either verified or rejected.' });
    }

    const record = await resource.model.findById(id).populate('user', 'name email');

    if (!record) {
      return res.status(404).json({ message: 'Record not found.' });
    }

    const normalizedComment = String(comment || '').trim().slice(0, 600);
    const normalizedRejectionReason = String(rejectionReason || '').trim().slice(0, 600);

    if (decision === 'rejected' && !normalizedRejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required when rejecting a record.' });
    }

    record.verificationStatus = decision;
    record.verificationComment = normalizedComment;
    record.verificationRejectedReason = decision === 'rejected' ? normalizedRejectionReason : '';
    record.verifiedBy = req.user._id;
    record.verifiedAt = new Date();

    await record.save();

    await VerificationEvent.create({
      resourceType,
      resourceId: record._id,
      student: record.user?._id,
      status: decision,
      reviewer: req.user._id,
      reviewerComment: normalizedComment,
      rejectionReason: decision === 'rejected' ? normalizedRejectionReason : '',
      reviewedAt: new Date(),
    });

    const humanDecision = decision === 'verified' ? 'verified' : 'rejected';
    await createNotification({
      recipient: record.user?._id,
      type: `verification.${decision}`,
      title: `${resource.label} ${humanDecision}`,
      message:
        decision === 'verified'
          ? `Your ${resource.label.toLowerCase()} record has been verified by faculty.`
          : `Your ${resource.label.toLowerCase()} record was rejected. ${normalizedRejectionReason}`,
      resourceType,
      resourceId: record._id,
    });

    await writeAuditLog({
      req,
      actor: req.user,
      action: `verification.${decision}`,
      resourceType,
      resourceId: record._id,
      metadata: {
        studentId: record.user?._id,
        comment: normalizedComment,
        rejectionReason: normalizedRejectionReason,
      },
    });

    await invalidateByPattern(`studenthub:dashboard:${record.user?._id}:*`);
    await invalidateByPattern(`studenthub:notifications:${record.user?._id}:*`);

    return res.status(200).json({
      message: `Record ${humanDecision} successfully.`,
      record,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getVerificationOverview = async (req, res, next) => {
  try {
    const resourceTypes = Object.keys(RESOURCE_MAP);

    const perResource = await Promise.all(
      resourceTypes.map(async (resourceType) => {
        const { model, label } = RESOURCE_MAP[resourceType];

        const [pending, verified, rejected] = await Promise.all([
          model.countDocuments({ verificationStatus: 'pending' }),
          model.countDocuments({ verificationStatus: 'verified' }),
          model.countDocuments({ verificationStatus: 'rejected' }),
        ]);

        return { resourceType, label, pending, verified, rejected, total: pending + verified + rejected };
      })
    );

    return res.status(200).json({ perResource });
  } catch (error) {
    return next(error);
  }
};
