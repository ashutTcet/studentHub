const Certificate = require('../models/Certificate');
const { createOwnedCrudController } = require('./ownedCrudFactory');

const sanitizeCertificatePayload = (payload, normalizeStringArray, isValidUrl) => {
  const data = { ...payload };

  if (data.credentialUrl && !isValidUrl(data.credentialUrl)) {
    throw new Error('Credential URL must be a valid URL.');
  }

  if (data.issueDate) {
    data.issueDate = new Date(data.issueDate);
  }

  if (data.issueDate && Number.isNaN(data.issueDate.getTime())) {
    throw new Error('Issue date is invalid.');
  }

  return data;
};

module.exports = createOwnedCrudController({
  Model: Certificate,
  resourceType: 'certificate',
  allowedFields: [
    'title',
    'issuingOrganization',
    'issueDate',
    'credentialId',
    'credentialUrl',
    'description',
    'file',
  ],
  fileField: 'file',
  sanitizePayload: sanitizeCertificatePayload,
});
