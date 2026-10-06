import EntityCrudPage from '../components/EntityCrudPage';

const fields = [
  {
    name: 'activityType',
    label: 'Activity Type',
    type: 'select',
    required: true,
    options: [
      { value: 'sports', label: 'Sports' },
      { value: 'cultural', label: 'Cultural' },
    ],
  },
  { name: 'activityName', label: 'Activity Name', type: 'text', required: true, maxLength: 180 },
  { name: 'eventName', label: 'Event Name', type: 'text', required: true, maxLength: 180 },
  { name: 'organization', label: 'Organization', type: 'text', maxLength: 180 },
  {
    name: 'level',
    label: 'Level',
    type: 'select',
    options: [
      { value: 'institution', label: 'Institution' },
      { value: 'district', label: 'District' },
      { value: 'state', label: 'State' },
      { value: 'national', label: 'National' },
      { value: 'international', label: 'International' },
      { value: 'other', label: 'Other' },
    ],
  },
  { name: 'role', label: 'Role', type: 'text', maxLength: 120 },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'result', label: 'Result', type: 'text', maxLength: 120 },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true, maxLength: 1200 },
];

const cardBuilder = (record) => ({
  title: `${record.activityType === 'sports' ? 'Sports' : 'Cultural'} - ${record.activityName}`,
  subtitle: record.eventName,
  lines: [
    { label: 'Date', value: record.date ? new Date(record.date).toLocaleDateString() : '-' },
    { label: 'Level', value: record.level },
    { label: 'Role', value: record.role },
    { label: 'Result', value: record.result },
  ],
});

const ActivitiesPage = () => {
  return (
    <EntityCrudPage
      title="Sports & Cultural Activities"
      subtitle="Manage sports and cultural participation records in one place."
      apiPath="/activities"
      fields={fields}
      cardBuilder={cardBuilder}
      fileField={{ name: 'evidenceFile', label: 'Activity evidence file' }}
      defaults={{ activityType: 'sports', level: 'other' }}
      createLabel="Add activity"
      updateLabel="Update activity"
    />
  );
};

export default ActivitiesPage;
