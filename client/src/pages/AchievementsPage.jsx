import EntityCrudPage from '../components/EntityCrudPage';

const fields = [
  { name: 'title', label: 'Achievement Title', type: 'text', required: true, maxLength: 160 },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true, maxLength: 1200 },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'academic', label: 'Academic' },
      { value: 'leadership', label: 'Leadership' },
      { value: 'community', label: 'Community' },
      { value: 'technical', label: 'Technical' },
      { value: 'sports', label: 'Sports' },
      { value: 'cultural', label: 'Cultural' },
      { value: 'other', label: 'Other' },
    ],
  },
  { name: 'date', label: 'Date', type: 'date', required: true },
  { name: 'issuingOrganization', label: 'Issuing Organization', type: 'text', maxLength: 160 },
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
];

const cardBuilder = (record) => ({
  title: record.title,
  subtitle: record.category,
  lines: [
    { label: 'Date', value: record.date ? new Date(record.date).toLocaleDateString() : '-' },
    { label: 'Level', value: record.level },
    { label: 'Organization', value: record.issuingOrganization },
  ],
});

const AchievementsPage = () => {
  return (
    <EntityCrudPage
      title="Achievements"
      subtitle="Capture meaningful achievements with evidence files."
      apiPath="/achievements"
      fields={fields}
      cardBuilder={cardBuilder}
      fileField={{ name: 'evidenceFile', label: 'Achievement evidence' }}
      defaults={{ category: 'other', level: 'other' }}
      createLabel="Add achievement"
      updateLabel="Update achievement"
    />
  );
};

export default AchievementsPage;
