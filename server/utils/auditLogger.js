const AuditLog = require('../models/AuditLog');

const writeAuditLog = async ({ req, actor, action, resourceType, resourceId = '', metadata = {} }) => {
  try {
    await AuditLog.create({
      actor: actor?._id || null,
      actorRole: actor?.role || '',
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : '',
      metadata,
      ip: req?.ip || req?.socket?.remoteAddress || '',
    });
  } catch (error) {
    // Logging failures must not break main workflows.
    console.error('Audit log write failed:', error.message);
  }
};

module.exports = { writeAuditLog };
