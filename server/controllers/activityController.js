const Activity = require('../models/Activity');
const { createOwnedCrudController } = require('./ownedCrudFactory');

const sanitizeActivityPayload = (payload) => {
  const data = { ...payload };

  if (data.date) data.date = new Date(data.date);
  if (data.date && Number.isNaN(data.date.getTime())) {
    throw new Error('Activity date is invalid.');
  }

  return data;
};

const listFilterBuilder = (query) => {
  const filter = {};

  if (query && (query.type === 'sports' || query.type === 'cultural')) {
    filter.activityType = query.type;
  }

  return filter;
};

module.exports = createOwnedCrudController({
  Model: Activity,
  resourceType: 'activity',
  allowedFields: ['activityType', 'activityName', 'eventName', 'organization', 'level', 'role', 'date', 'result', 'description', 'evidenceFile'],
  fileField: 'evidenceFile',
  sanitizePayload: sanitizeActivityPayload,
  listFilterBuilder,
});
