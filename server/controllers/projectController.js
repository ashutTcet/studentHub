const Project = require('../models/Project');
const { createOwnedCrudController } = require('./ownedCrudFactory');

const sanitizeProjectPayload = (payload, normalizeStringArray, isValidUrl) => {
  const data = { ...payload };

  if (Object.prototype.hasOwnProperty.call(data, 'technologies')) {
    data.technologies = normalizeStringArray(data.technologies);
  }

  if (data.projectUrl && !isValidUrl(data.projectUrl)) {
    throw new Error('Project URL must be a valid URL.');
  }

  if (data.githubUrl && !isValidUrl(data.githubUrl)) {
    throw new Error('GitHub URL must be a valid URL.');
  }

  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);

  if (data.startDate && Number.isNaN(data.startDate.getTime())) {
    throw new Error('Project start date is invalid.');
  }

  if (data.endDate && Number.isNaN(data.endDate.getTime())) {
    throw new Error('Project end date is invalid.');
  }

  return data;
};

module.exports = createOwnedCrudController({
  Model: Project,
  resourceType: 'project',
  allowedFields: [
    'title',
    'description',
    'technologies',
    'role',
    'projectType',
    'startDate',
    'endDate',
    'projectUrl',
    'githubUrl',
    'organization',
    'status',
    'supportingFile',
  ],
  fileField: 'supportingFile',
  sanitizePayload: sanitizeProjectPayload,
});
