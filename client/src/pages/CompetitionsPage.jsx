import EntityCrudPage from '../components/EntityCrudPage';

const fields = [
  { name: 'competitionName', label: 'Competition Name', type: 'text', required: true, maxLength: 180 },
  { name: 'organizer', label: 'Organizer', type: 'text', required: true, maxLength: 180 },
  { name: 'participationDate', label: 'Participation Date', type: 'date', required: true },
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
  { name: 'result', label: 'Result', type: 'text', maxLength: 120 },
  { name: 'position', label: 'Position', type: 'text', maxLength: 80 },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true, maxLength: 1200 },
];

const cardBuilder = (record) => ({
  title: record.competitionName,
  subtitle: record.organizer,
  lines: [
    { label: 'Date', value: record.participationDate ? new Date(record.participationDate).toLocaleDateString() : '-' },
    { label: 'Level', value: record.level },
    { label: 'Result', value: record.result },
    { label: 'Position', value: record.position },
  ],
});

const CompetitionsPage = () => {
  return (
    <EntityCrudPage
      title="Competitions"
      subtitle="Track competitions with results, positions, and evidence."
      apiPath="/competitions"
      fields={fields}
      cardBuilder={cardBuilder}
      fileField={{ name: 'evidenceFile', label: 'Competition evidence' }}
      defaults={{ level: 'other' }}
      createLabel="Add competition"
      updateLabel="Update competition"
    />
  );
};

export default CompetitionsPage;
