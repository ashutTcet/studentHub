import EntityCrudPage from '../components/EntityCrudPage';

const fields = [
  { name: 'organization', label: 'Organization', type: 'text', required: true, maxLength: 120 },
  { name: 'role', label: 'Role', type: 'text', required: true, maxLength: 120 },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true, maxLength: 1200 },
  {
    name: 'internshipType',
    label: 'Internship Type',
    type: 'select',
    options: [
      { value: 'full-time', label: 'Full-time' },
      { value: 'part-time', label: 'Part-time' },
      { value: 'remote', label: 'Remote' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'on-site', label: 'On-site' },
      { value: 'training', label: 'Training' },
      { value: 'other', label: 'Other' },
    ],
  },
  { name: 'location', label: 'Location', type: 'text', maxLength: 120 },
  { name: 'startDate', label: 'Start Date', type: 'date', required: true },
  { name: 'endDate', label: 'End Date', type: 'date' },
  { name: 'technologies', label: 'Technologies (comma separated)', type: 'tags' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'ongoing', label: 'Ongoing' },
      { value: 'completed', label: 'Completed' },
    ],
  },
];

const cardBuilder = (record) => ({
  title: `${record.organization} - ${record.role}`,
  subtitle: record.internshipType || '',
  lines: [
    { label: 'Location', value: record.location },
    { label: 'Status', value: record.status },
    { label: 'Start', value: record.startDate ? new Date(record.startDate).toLocaleDateString() : '-' },
    { label: 'End', value: record.endDate ? new Date(record.endDate).toLocaleDateString() : '-' },
  ],
});

const InternshipsPage = () => {
  return (
    <EntityCrudPage
      title="Internships"
      subtitle="Maintain your internship history with real supporting documents."
      apiPath="/internships"
      fields={fields}
      cardBuilder={cardBuilder}
      fileField={{ name: 'documentFile', label: 'Internship certificate/document' }}
      defaults={{ internshipType: 'other', status: 'completed' }}
      createLabel="Add internship"
      updateLabel="Update internship"
    />
  );
};

export default InternshipsPage;
