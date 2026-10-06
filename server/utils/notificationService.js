const Notification = require('../models/Notification');

const createNotification = async ({ recipient, type, title, message, resourceType = '', resourceId = '' }) => {
  if (!recipient) return null;

  return Notification.create({
    recipient,
    type,
    title,
    message,
    resourceType,
    resourceId: resourceId ? String(resourceId) : '',
  });
};

module.exports = { createNotification };
