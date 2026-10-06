const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AcademicRecord = require('../models/AcademicRecord');
const Project = require('../models/Project');
const Internship = require('../models/Internship');
const Certificate = require('../models/Certificate');
const Achievement = require('../models/Achievement');
const Competition = require('../models/Competition');
const Activity = require('../models/Activity');
const { invalidateByPattern } = require('../middleware/cache');

const sanitizeProfile = (profile) => {
  if (!profile) {
    return {
      rollNumber: '',
      department: '',
      course: '',
      academicYear: '',
      semester: '',
      phone: '',
      bio: '',
      linkedinUrl: '',
      githubUrl: '',
      portfolioUrl: '',
      profilePhotoUrl: '',
    };
  }

  return {
    rollNumber: profile.rollNumber || '',
    enrollmentNumber: profile.enrollmentNumber || '',
    department: profile.department || '',
    course: profile.course || '',
    academicYear: profile.academicYear || '',
    semester: profile.semester || '',
    phone: profile.phone || '',
    bio: profile.bio || '',
    linkedinUrl: profile.linkedinUrl || '',
    githubUrl: profile.githubUrl || '',
    portfolioUrl: profile.portfolioUrl || '',
    profilePhotoUrl: profile.profilePhotoUrl || '',
  };
};

const buildProfileCompletion = (profile = {}, user = {}) => {
  const meaningfulValues = [
    user.name,
    user.email,
    profile.rollNumber,
    profile.enrollmentNumber,
    profile.department,
    profile.course,
    profile.academicYear,
    profile.semester,
    profile.phone,
    profile.bio,
    profile.linkedinUrl,
    profile.githubUrl,
    profile.portfolioUrl,
  ];

  const filledCount = meaningfulValues.filter((value) => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return Boolean(value);
  }).length;

  const totalCount = meaningfulValues.length;
  const percentage = Math.round((filledCount / totalCount) * 100);
  return Math.min(100, Math.max(0, percentage));
};

const isValidUrl = (value) => {
  if (!value || !String(value).trim()) return true;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch (error) {
    return false;
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password').lean();
    const profile = await StudentProfile.findOne({ user: req.user._id }).lean();

    res.status(200).json({
      user,
      profile: sanitizeProfile(profile),
      profileCompletion: buildProfileCompletion(profile || {}, user || {}),
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name',
      'email',
      'rollNumber',
      'enrollmentNumber',
      'department',
      'course',
      'academicYear',
      'semester',
      'phone',
      'bio',
      'linkedinUrl',
      'githubUrl',
      'portfolioUrl',
      'profilePhotoUrl',
    ];

    const updates = {};
    const existingProfile = await StudentProfile.findOne({ user: req.user._id });
    const expectedUpdatedAt = req.body?.expectedUpdatedAt ? new Date(req.body.expectedUpdatedAt) : null;
    if (
      existingProfile &&
      expectedUpdatedAt &&
      !Number.isNaN(expectedUpdatedAt.getTime()) &&
      existingProfile.updatedAt > expectedUpdatedAt
    ) {
      return res.status(409).json({
        message: 'Conflict detected. Profile has changed on the server.',
        conflict: true,
        serverRecord: existingProfile,
      });
    }

    const validateLength = (field, value, maxLength) => {
      if (String(value).trim().length > maxLength) {
        throw new Error(`${field} cannot exceed ${maxLength} characters.`);
      }
    };

    const isValidAcademicYear = (value) => {
      const match = /^(\d{4})-(\d{4})$/.exec(value);
      if (!match) return false;

      const startYear = Number(match[1]);
      const endYear = Number(match[2]);
      return endYear === startYear + 1;
    };

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        const value = req.body[field];

        if (field === 'name' && (!value || String(value).trim().length < 2)) {
          return res.status(400).json({ message: 'Please enter a valid name.' });
        }

        if (field === 'name') {
          validateLength('Name', value, 100);
        }

        if (field === 'email') {
          const normalizedEmail = String(value).trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
          }

          const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } });
          if (existingUser) {
            return res.status(409).json({ message: 'That email address is already in use.' });
          }

          updates.email = normalizedEmail;
          continue;
        }

        if (field === 'phone' && value && !/^[0-9+\-\s()]{7,20}$/.test(String(value).trim())) {
          return res.status(400).json({ message: 'Please provide a valid phone number.' });
        }

        if (field === 'rollNumber' || field === 'enrollmentNumber') {
          validateLength(field === 'rollNumber' ? 'Roll number' : 'Enrollment number', value || '', 50);
        }

        if (field === 'department') {
          validateLength('Department', value || '', 100);
        }

        if (field === 'course') {
          validateLength('Course', value || '', 120);
        }

        if (field === 'academicYear' && value && !isValidAcademicYear(String(value).trim())) {
          return res.status(400).json({ message: 'Academic year must be in YYYY-YYYY format (for example, 2025-2026).' });
        }

        if (field === 'semester' && value !== '' && value !== null && value !== undefined) {
          const numericSemester = Number(value);
          if (!Number.isInteger(numericSemester) || numericSemester < 1 || numericSemester > 12) {
            return res.status(400).json({ message: 'Semester must be an integer between 1 and 12.' });
          }
          updates[field] = String(numericSemester);
          continue;
        }

        if (field === 'bio') {
          validateLength('Bio', value || '', 500);
        }

        if ((field === 'linkedinUrl' || field === 'githubUrl' || field === 'portfolioUrl' || field === 'profilePhotoUrl') && value && !isValidUrl(value)) {
          return res.status(400).json({ message: 'Please provide a valid URL.' });
        }

        updates[field] = typeof value === 'string' ? value.trim() : value;
      }
    }

    if (updates.name) {
      await User.findByIdAndUpdate(req.user._id, { name: updates.name });
      delete updates.name;
    }

    if (updates.email) {
      await User.findByIdAndUpdate(req.user._id, { email: updates.email });
      delete updates.email;
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: { user: req.user._id, ...updates } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    const user = await User.findById(req.user._id).select('-password').lean();

    await invalidateByPattern(`studenthub:dashboard:${req.user._id}:*`);

    res.status(200).json({
      message: 'Profile updated successfully.',
      user,
      profile: sanitizeProfile(profile),
      profileCompletion: buildProfileCompletion(profile || {}, user || {}),
    });
  } catch (error) {
    if (error.message && /cannot exceed/i.test(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
};

exports.getConsolidatedProfile = async (req, res, next) => {
  try {
    const perModuleLimit = Math.min(100, Math.max(1, Number.parseInt(req.query.perModuleLimit, 10) || 20));
    const [user, profile, academicRecords, projects, internships, certificates, achievements, competitions, activities] = await Promise.all([
      User.findById(req.user._id).select('-password').lean(),
      StudentProfile.findOne({ user: req.user._id }).lean(),
      AcademicRecord.find({ user: req.user._id }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
      Project.find({ user: req.user._id }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
      Internship.find({ user: req.user._id }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
      Certificate.find({ user: req.user._id }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
      Achievement.find({ user: req.user._id }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
      Competition.find({ user: req.user._id }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
      Activity.find({ user: req.user._id }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
    ]);

    res.status(200).json({
      user,
      profile: sanitizeProfile(profile),
      profileCompletion: buildProfileCompletion(profile || {}, user || {}),
      records: {
        academicRecords,
        projects,
        internships,
        certificates,
        achievements,
        competitions,
        activities,
      },
      limitApplied: perModuleLimit,
    });
  } catch (error) {
    next(error);
  }
};

exports.getVerifiedProfile = async (req, res, next) => {
  try {
    const perModuleLimit = Math.min(100, Math.max(1, Number.parseInt(req.query.perModuleLimit, 10) || 20));
    const [user, profile, projects, internships, certificates, achievements, competitions, activities] = await Promise.all([
      User.findById(req.user._id).select('-password').lean(),
      StudentProfile.findOne({ user: req.user._id }).lean(),
      Project.find({ user: req.user._id, verificationStatus: 'verified' }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
      Internship.find({ user: req.user._id, verificationStatus: 'verified' }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
      Certificate.find({ user: req.user._id, verificationStatus: 'verified' }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
      Achievement.find({ user: req.user._id, verificationStatus: 'verified' }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
      Competition.find({ user: req.user._id, verificationStatus: 'verified' }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
      Activity.find({ user: req.user._id, verificationStatus: 'verified' }).lean().sort({ createdAt: -1 }).limit(perModuleLimit),
    ]);

    res.status(200).json({
      user,
      profile: sanitizeProfile(profile),
      records: {
        projects,
        internships,
        certificates,
        achievements,
        competitions,
        activities,
      },
      limitApplied: perModuleLimit,
    });
  } catch (error) {
    next(error);
  }
};
