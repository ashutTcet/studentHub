const Achievement = require('../models/Achievement');
const { createOwnedCrudController } = require('./ownedCrudFactory');

const sanitizeAchievementPayload = (payload) => {
  const data = { ...payload };

  if (data.date) data.date = new Date(data.date);
  if (data.date && Number.isNaN(data.date.getTime())) {
    throw new Error('Achievement date is invalid.');
  }

  return data;
};

module.exports = createOwnedCrudController({
  Model: Achievement,
  resourceType: 'achievement',
  allowedFields: ['title', 'description', 'category', 'date', 'issuingOrganization', 'level', 'evidenceFile'],
  fileField: 'evidenceFile',
  sanitizePayload: sanitizeAchievementPayload,
});
