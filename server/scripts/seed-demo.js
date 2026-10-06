const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { connectDB, closeDB } = require('../config/db');
const { closeRedis } = require('../config/redis');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Project = require('../models/Project');
const Internship = require('../models/Internship');
const Certificate = require('../models/Certificate');
const Achievement = require('../models/Achievement');
const Competition = require('../models/Competition');
const Activity = require('../models/Activity');

const now = new Date();

const ensureDevelopmentMode = () => {
  if ((process.env.NODE_ENV || 'development') === 'production') {
    throw new Error('Refusing to seed demo data in production environment.');
  }
};

const getRequiredDemoPassword = () => {
  const password = String(process.env.DEMO_FACULTY_PASSWORD || '').trim();

  if (!password) {
    throw new Error('DEMO_FACULTY_PASSWORD is required to seed demo users.');
  }

  if (password.length < 8) {
    throw new Error('DEMO_FACULTY_PASSWORD must be at least 8 characters long.');
  }

  return password;
};

const buildVerificationFields = (status, facultyUserId, comment, rejectionReason) => {
  if (status === 'verified') {
    return {
      verificationStatus: 'verified',
      verificationComment: comment || 'Verified during development demo seed.',
      verificationRejectedReason: '',
      verifiedBy: facultyUserId,
      verifiedAt: now,
    };
  }

  if (status === 'rejected') {
    return {
      verificationStatus: 'rejected',
      verificationComment: comment || 'Reviewed by demo faculty account.',
      verificationRejectedReason: rejectionReason || 'Evidence details need clarification before approval.',
      verifiedBy: facultyUserId,
      verifiedAt: now,
    };
  }

  return {
    verificationStatus: 'pending',
    verificationComment: '',
    verificationRejectedReason: '',
    verifiedBy: null,
    verifiedAt: null,
  };
};

const ensureUser = async ({ name, email, role, password }) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });

  if (!existing) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return User.create({
      name,
      email: normalizedEmail,
      role,
      password: hashedPassword,
      isActive: true,
    });
  }

  existing.name = name;
  existing.role = role;
  existing.isActive = true;

  const passwordMatches = await bcrypt.compare(password, existing.password);
  if (!passwordMatches) {
    existing.password = await bcrypt.hash(password, 10);
  }

  await existing.save();
  return existing;
};

const ensureStudentProfile = async (userId, profile) => {
  await StudentProfile.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        user: userId,
        rollNumber: profile.rollNumber,
        enrollmentNumber: profile.enrollmentNumber,
        department: profile.department,
        course: profile.course,
        academicYear: profile.academicYear,
        semester: profile.semester,
        phone: profile.phone,
        bio: profile.bio,
      },
    },
    { upsert: true, setDefaultsOnInsert: true }
  );
};

const upsertDemoRecord = async (Model, query, payload) => {
  await Model.findOneAndUpdate(
    query,
    { $set: payload },
    { upsert: true, setDefaultsOnInsert: true, returnDocument: 'after' }
  );
};

const seedRecordsForStudent = async ({ student, facultyUserId, index }) => {
  await upsertDemoRecord(
    Project,
    { user: student._id, title: 'Smart Complaint Portal' },
    {
      user: student._id,
      title: 'Smart Complaint Portal',
      description: 'Built a MERN application for complaint tracking and faculty escalation workflows.',
      technologies: ['MERN', 'React', 'Node.js', 'Express', 'MongoDB'],
      role: 'Full-stack developer',
      projectType: 'academic',
      startDate: new Date('2025-01-10'),
      endDate: new Date('2025-04-10'),
      projectUrl: 'https://github.com/studenthub/demo-complaint-portal',
      githubUrl: 'https://github.com/studenthub/demo-complaint-portal',
      organization: 'StudentHub Demo Department',
      status: 'completed',
      ...buildVerificationFields('pending', facultyUserId),
    }
  );

  await upsertDemoRecord(
    Project,
    { user: student._id, title: 'Campus Event API' },
    {
      user: student._id,
      title: 'Campus Event API',
      description: 'Designed REST API endpoints for event publishing with role-based approvals.',
      technologies: ['Express', 'MongoDB', 'JWT'],
      role: 'Backend developer',
      projectType: 'research',
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-11-20'),
      organization: 'Computer Science Club',
      status: 'completed',
      ...buildVerificationFields('verified', facultyUserId, 'Code repository and report reviewed. Looks good.'),
    }
  );

  await upsertDemoRecord(
    Internship,
    { user: student._id, organization: 'Acme Digital Labs', role: 'Software Intern' },
    {
      user: student._id,
      organization: 'Acme Digital Labs',
      role: 'Software Intern',
      description: 'Implemented React dashboard widgets and Express APIs for mentor analytics.',
      internshipType: 'hybrid',
      location: 'Bengaluru',
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-07-31'),
      technologies: ['React', 'Node.js', 'Express'],
      status: 'completed',
      ...buildVerificationFields('pending', facultyUserId),
    }
  );

  await upsertDemoRecord(
    Certificate,
    { user: student._id, title: 'Cloud Fundamentals Certificate', issuingOrganization: 'Microsoft Learn' },
    {
      user: student._id,
      title: 'Cloud Fundamentals Certificate',
      issuingOrganization: 'Microsoft Learn',
      issueDate: new Date('2025-02-14'),
      credentialId: `MS-${index}-CF-2025`,
      credentialUrl: 'https://learn.microsoft.com',
      description: 'Completed cloud service basics and deployment modules.',
      ...buildVerificationFields('verified', facultyUserId, 'Certificate ID and issuer validated.'),
    }
  );

  await upsertDemoRecord(
    Achievement,
    { user: student._id, title: 'Department Innovation Award' },
    {
      user: student._id,
      title: 'Department Innovation Award',
      description: 'Recognized for building a student workflow automation prototype.',
      category: 'technical',
      date: new Date('2025-03-18'),
      issuingOrganization: 'Department of Computer Science',
      level: 'institution',
      ...buildVerificationFields('pending', facultyUserId),
    }
  );

  await upsertDemoRecord(
    Competition,
    { user: student._id, competitionName: 'National Hack Sprint', organizer: 'TechForum India' },
    {
      user: student._id,
      competitionName: 'National Hack Sprint',
      organizer: 'TechForum India',
      participationDate: new Date('2025-01-28'),
      level: 'national',
      result: 'Finalist',
      position: 'Top 12',
      description: 'Built an accessibility-first campus navigation app using React.',
      ...buildVerificationFields('rejected', facultyUserId, 'Result details reviewed.', 'Please attach participation certificate with organizer signature.'),
    }
  );

  await upsertDemoRecord(
    Activity,
    {
      user: student._id,
      activityType: 'sports',
      activityName: 'Intercollege Football Tournament',
      eventName: 'Zonal Sports Meet 2025',
    },
    {
      user: student._id,
      activityType: 'sports',
      activityName: 'Intercollege Football Tournament',
      eventName: 'Zonal Sports Meet 2025',
      organization: 'University Sports Board',
      level: 'district',
      role: 'Team Captain',
      date: new Date('2025-02-08'),
      result: 'Runner-up',
      description: 'Led the team through qualifier and final rounds.',
      ...buildVerificationFields('pending', facultyUserId),
    }
  );

  await upsertDemoRecord(
    Activity,
    {
      user: student._id,
      activityType: 'cultural',
      activityName: 'Classical Dance Performance',
      eventName: 'Annual Cultural Fest 2024',
    },
    {
      user: student._id,
      activityType: 'cultural',
      activityName: 'Classical Dance Performance',
      eventName: 'Annual Cultural Fest 2024',
      organization: 'Fine Arts Council',
      level: 'institution',
      role: 'Performer',
      date: new Date('2024-10-14'),
      result: 'Participation',
      description: 'Performed a fusion group piece during opening ceremony.',
      ...buildVerificationFields('verified', facultyUserId, 'Event listing and participation proof confirmed.'),
    }
  );
};

const run = async () => {
  ensureDevelopmentMode();
  const facultyPassword = getRequiredDemoPassword();
  const studentPassword = String(process.env.DEMO_STUDENT_PASSWORD || facultyPassword).trim();

  if (studentPassword.length < 8) {
    throw new Error('DEMO_STUDENT_PASSWORD must be at least 8 characters long when provided.');
  }

  await connectDB();

  const faculty = await ensureUser({
    role: 'faculty',
    name: '[DEMO] Demo Faculty',
    email: 'faculty.demo@studenthub.local',
    password: facultyPassword,
  });

  const students = [
    {
      name: '[DEMO] Ananya Rao',
      email: 'student.ananya@studenthub.local',
      profile: {
        rollNumber: 'DEMO-CS-001',
        enrollmentNumber: 'DEMO-ENR-001',
        department: 'Computer Science',
        course: 'B.Tech CSE',
        academicYear: '2025-2026',
        semester: '6',
        phone: '+91-9000000001',
        bio: 'Development/demo student profile for faculty verification walkthroughs.',
      },
    },
    {
      name: '[DEMO] Karthik Menon',
      email: 'student.karthik@studenthub.local',
      profile: {
        rollNumber: 'DEMO-CS-002',
        enrollmentNumber: 'DEMO-ENR-002',
        department: 'Information Technology',
        course: 'B.Tech IT',
        academicYear: '2025-2026',
        semester: '6',
        phone: '+91-9000000002',
        bio: 'Development/demo student profile for faculty verification walkthroughs.',
      },
    },
  ];

  const createdStudents = [];
  for (const studentConfig of students) {
    // eslint-disable-next-line no-await-in-loop
    const student = await ensureUser({
      role: 'student',
      name: studentConfig.name,
      email: studentConfig.email,
      password: studentPassword,
    });

    // eslint-disable-next-line no-await-in-loop
    await ensureStudentProfile(student._id, studentConfig.profile);
    createdStudents.push(student);
  }

  for (let i = 0; i < createdStudents.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await seedRecordsForStudent({
      student: createdStudents[i],
      facultyUserId: faculty._id,
      index: i + 1,
    });
  }

  const [projectStatus, internshipStatus, certificateStatus, achievementStatus, competitionStatus, activityStatus] =
    await Promise.all([
      Project.aggregate([{ $match: { user: { $in: createdStudents.map((student) => student._id) } } }, { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }]),
      Internship.aggregate([{ $match: { user: { $in: createdStudents.map((student) => student._id) } } }, { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }]),
      Certificate.aggregate([{ $match: { user: { $in: createdStudents.map((student) => student._id) } } }, { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }]),
      Achievement.aggregate([{ $match: { user: { $in: createdStudents.map((student) => student._id) } } }, { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }]),
      Competition.aggregate([{ $match: { user: { $in: createdStudents.map((student) => student._id) } } }, { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }]),
      Activity.aggregate([{ $match: { user: { $in: createdStudents.map((student) => student._id) } } }, { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }]),
    ]);

  console.log('Development/demo seed completed successfully.');
  console.log('Faculty demo account:', faculty.email);
  console.log('Student demo accounts:', createdStudents.map((student) => student.email).join(', '));
  console.log('Projects status summary:', projectStatus);
  console.log('Internships status summary:', internshipStatus);
  console.log('Certificates status summary:', certificateStatus);
  console.log('Achievements status summary:', achievementStatus);
  console.log('Competitions status summary:', competitionStatus);
  console.log('Activities status summary:', activityStatus);
};

run()
  .catch((error) => {
    console.error(`Demo seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closeRedis();
      await closeDB();
    } catch (closeError) {
      console.error(`Cleanup warning: ${closeError.message}`);
    }
  });
