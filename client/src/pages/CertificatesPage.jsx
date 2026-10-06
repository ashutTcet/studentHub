import EntityCrudPage from '../components/EntityCrudPage';

const fields = [
  { name: 'title', label: 'Certificate Title', type: 'text', required: true, maxLength: 160 },
  { name: 'issuingOrganization', label: 'Issuing Organization', type: 'text', required: true, maxLength: 160 },
  { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
  { name: 'credentialId', label: 'Credential ID', type: 'text', maxLength: 120 },
  { name: 'credentialUrl', label: 'Credential URL', type: 'url' },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true, maxLength: 1200 },
  {
    name: 'verificationStatus',
    label: 'Verification Status',
    type: 'select',
    options: [
      { value: 'unverified', label: 'Unverified' },
      { value: 'verified', label: 'Verified' },
    ],
  },
];

const cardBuilder = (record) => ({
  title: record.title,
  subtitle: record.issuingOrganization,
  lines: [
    { label: 'Issue Date', value: record.issueDate ? new Date(record.issueDate).toLocaleDateString() : '-' },
    { label: 'Credential ID', value: record.credentialId },
    { label: 'Verification', value: record.verificationStatus },
  ],
});

const CertificatesPage = () => {
  return (
    <EntityCrudPage
      title="Certificates"
      subtitle="Store verifiable certificate records with secure file attachments."
      apiPath="/certificates"
      fields={fields}
      cardBuilder={cardBuilder}
      fileField={{ name: 'file', label: 'Certificate file' }}
      defaults={{ verificationStatus: 'unverified' }}
      createLabel="Add certificate"
      updateLabel="Update certificate"
    />
  );
};

export default CertificatesPage;
