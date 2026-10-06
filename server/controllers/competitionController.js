const Competition = require('../models/Competition');
const { createOwnedCrudController } = require('./ownedCrudFactory');

const sanitizeCompetitionPayload = (payload) => {
  const data = { ...payload };

  if (data.participationDate) data.participationDate = new Date(data.participationDate);
  if (data.participationDate && Number.isNaN(data.participationDate.getTime())) {
    throw new Error('Participation date is invalid.');
  }

  return data;
};

module.exports = createOwnedCrudController({
  Model: Competition,
  resourceType: 'competition',
  allowedFields: ['competitionName', 'organizer', 'participationDate', 'level', 'result', 'position', 'description', 'evidenceFile'],
  fileField: 'evidenceFile',
  sanitizePayload: sanitizeCompetitionPayload,
});
