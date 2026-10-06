const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const StudentProfile = require('../models/StudentProfile');
const { createNotification } = require('../utils/notificationService');
const { writeAuditLog } = require('../utils/auditLogger');
const { invalidateByPattern } = require('../middleware/cache');

exports.health = (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'Admin access confirmed.',
    user: req.user,
  });
};

exports.listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10));
    const search = String(req.query.search || '').trim();
    const role = ['student', 'faculty', 'admin'].includes(req.query.role) ? req.query.role : '';
    const status = req.query.status === 'inactive' ? false : req.query.status === 'active' ? true : null;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (status !== null) {
      query.isActive = status;
    }

    if (search) {
      query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .lean()
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
    ]);

    const studentIds = users.filter((user) => user.role === 'student').map((user) => user._id);
    const profiles = await StudentProfile.find({ user: { $in: studentIds } }).select('user department course semester academicYear').lean();
    const profileMap = new Map(profiles.map((profile) => [String(profile.user), profile]));

    const records = users.map((user) => {
      const profile = profileMap.get(String(user._id));
      return {
        ...user,
        profile: profile
          ? {
              department: profile.department || '',
              course: profile.course || '',
              semester: profile.semester || '',
              academicYear: profile.academicYear || '',
            }
          : null,
      };
    });

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

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isActive, disabledReason } = req.body || {};

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean.' });
    }

    const target = await User.findById(userId).select('-password');

    if (!target) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (String(target._id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    target.isActive = isActive;
    target.disabledReason = isActive ? '' : String(disabledReason || '').trim().slice(0, 240);
    await target.save();

    await writeAuditLog({
      req,
      actor: req.user,
      action: isActive ? 'admin.user.activate' : 'admin.user.deactivate',
      resourceType: 'user',
      resourceId: target._id,
      metadata: { disabledReason: target.disabledReason },
    });

    await createNotification({
      recipient: target._id,
      type: isActive ? 'account.activated' : 'account.deactivated',
      title: isActive ? 'Account activated' : 'Account deactivated',
      message: isActive
        ? 'Your account has been activated by an administrator.'
        : `Your account has been deactivated by an administrator. ${target.disabledReason}`,
      resourceType: 'user',
      resourceId: target._id,
    });

    await invalidateByPattern(`studenthub:notifications:${target._id}:*`);

    return res.status(200).json({
      message: isActive ? 'User activated successfully.' : 'User deactivated successfully.',
      user: target,
    });
  } catch (error) {
    return next(error);
  }
};

exports.listAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20));
    const action = String(req.query.action || '').trim();

    const query = {};
    if (action) {
      query.action = new RegExp(action, 'i');
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .lean()
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
    ]);

    return res.status(200).json({
      records: logs,
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
