import EntityCrudPage from '../components/EntityCrudPage';

const fields = [
  { name: 'title', label: 'Project Title', type: 'text', required: true, maxLength: 120 },
  { name: 'description', label: 'Description', type: 'textarea', fullWidth: true, maxLength: 1200 },
  { name: 'technologies', label: 'Technologies (comma separated)', type: 'tags' },
  { name: 'role', label: 'Role', type: 'text', maxLength: 120 },
  {
    name: 'projectType',
    label: 'Project Type',
    type: 'select',
    options: [
      { value: 'academic', label: 'Academic' },
      { value: 'personal', label: 'Personal' },
      { value: 'freelance', label: 'Freelance' },
      { value: 'research', label: 'Research' },
      { value: 'open-source', label: 'Open Source' },
      { value: 'other', label: 'Other' },
    ],
  },
  { name: 'startDate', label: 'Start Date', type: 'date', required: true },
  { name: 'endDate', label: 'End Date', type: 'date' },
  { name: 'projectUrl', label: 'Project URL', type: 'url' },
  { name: 'githubUrl', label: 'GitHub URL', type: 'url' },
  { name: 'organization', label: 'Organization', type: 'text', maxLength: 120 },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'planned', label: 'Planned' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'on-hold', label: 'On Hold' },
    ],
  },
];

const cardBuilder = (record) => ({
  title: record.title,
  subtitle: record.organization || '',
  lines: [
    { label: 'Role', value: record.role },
    { label: 'Type', value: record.projectType },
    { label: 'Status', value: record.status },
    { label: 'Start', value: record.startDate ? new Date(record.startDate).toLocaleDateString() : '-' },
  ],
});

const ProjectsPage = () => {
  return (
    <EntityCrudPage
      title="Projects"
      subtitle="Track your academic, personal, and professional projects."
      apiPath="/projects"
      fields={fields}
      cardBuilder={cardBuilder}
      fileField={{ name: 'supportingFile', label: 'Project supporting document' }}
      defaults={{ projectType: 'other', status: 'completed' }}
      createLabel="Add project"
      updateLabel="Update project"
    />
  );
};

export default ProjectsPage;
