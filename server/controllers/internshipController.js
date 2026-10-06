const Internship = require('../models/Internship');
const { createOwnedCrudController } = require('./ownedCrudFactory');

const sanitizeInternshipPayload = (payload, normalizeStringArray) => {
  const data = { ...payload };

  if (Object.prototype.hasOwnProperty.call(data, 'technologies')) {
    data.technologies = normalizeStringArray(data.technologies);
  }

  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);

  if (data.startDate && Number.isNaN(data.startDate.getTime())) {
    throw new Error('Internship start date is invalid.');
  }

  if (data.endDate && Number.isNaN(data.endDate.getTime())) {
    throw new Error('Internship end date is invalid.');
  }

  return data;
};

module.exports = createOwnedCrudController({
  Model: Internship,
  resourceType: 'internship',
  allowedFields: [
    'organization',
    'role',
    'description',
    'internshipType',
    'location',
    'startDate',
    'endDate',
    'technologies',
    'status',
    'documentFile',
  ],
  fileField: 'documentFile',
  sanitizePayload: sanitizeInternshipPayload,
});
