const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { invalidateByPattern } = require('../middleware/cache');

exports.listNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 15));
    const onlyUnread = String(req.query.onlyUnread || '').toLowerCase() === 'true';

    const query = { recipient: req.user._id };
    if (onlyUnread) {
      query.isRead = false;
    }

    const [total, unreadCount, records] = await Promise.all([
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
      Notification.find(query)
        .lean()
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
    ]);

    return res.status(200).json({
      records,
      unreadCount,
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

exports.markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification ID.' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { isRead: true },
      { returnDocument: 'after' }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    await invalidateByPattern(`studenthub:notifications:${req.user._id}:*`);

    return res.status(200).json({ message: 'Notification marked as read.', notification });
  } catch (error) {
    return next(error);
  }
};

exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    await invalidateByPattern(`studenthub:notifications:${req.user._id}:*`);
    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error) {
    return next(error);
  }
};
