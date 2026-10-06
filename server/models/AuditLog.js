const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actorRole: {
      type: String,
      trim: true,
      maxlength: 30,
      default: '',
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true,
    },
    resourceId: {
      type: String,
      trim: true,
      maxlength: 64,
      default: '',
      index: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
    ip: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
