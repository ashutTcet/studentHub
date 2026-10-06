const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AcademicRecord = require('../models/AcademicRecord');
const Project = require('../models/Project');
const Internship = require('../models/Internship');
const Certificate = require('../models/Certificate');
const Achievement = require('../models/Achievement');
const Competition = require('../models/Competition');
const Activity = require('../models/Activity');

const aggregateCountByUsers = async (Model, userIds, filter = {}) => {
  const rows = await Model.aggregate([
    { $match: { user: { $in: userIds }, ...filter } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.count]));
};

exports.listStudentDirectory = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10));
    const search = String(req.query.search || '').trim();
    const department = String(req.query.department || '').trim();
    const course = String(req.query.course || '').trim();
    const academicYear = String(req.query.academicYear || '').trim();
    const semester = String(req.query.semester || '').trim();

    const profileQuery = {};
    if (department) profileQuery.department = department;
    if (course) profileQuery.course = course;
    if (academicYear) profileQuery.academicYear = academicYear;
    if (semester) profileQuery.semester = semester;

    const matchingProfiles = await StudentProfile.find(profileQuery)
      .select('user department course academicYear semester rollNumber enrollmentNumber phone')
      .lean();
    const studentIdsByProfile = matchingProfiles.map((profile) => profile.user);

    const userQuery = {
      role: 'student',
      isActive: true,
      ...(studentIdsByProfile.length ? { _id: { $in: studentIdsByProfile } } : profileQuery && Object.keys(profileQuery).length ? { _id: { $in: [] } } : {}),
    };

    if (search) {
      userQuery.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    }

    const [total, students] = await Promise.all([
      User.countDocuments(userQuery),
      User.find(userQuery)
        .select('-password')
        .lean()
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize),
    ]);

    if (!students.length) {
      return res.status(200).json({
        records: [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          hasNextPage: false,
        },
      });
    }

    const pageStudentIds = students.map((student) => student._id);
    const [
      profileRows,
      academicMap,
      projectMap,
      internshipMap,
      certificateMap,
      achievementMap,
      competitionMap,
      activityMap,
      verifiedProjectMap,
      verifiedInternshipMap,
      verifiedCertificateMap,
      verifiedAchievementMap,
      verifiedCompetitionMap,
      verifiedActivityMap,
    ] = await Promise.all([
      StudentProfile.find({ user: { $in: pageStudentIds } })
        .select('user rollNumber enrollmentNumber department course academicYear semester phone')
        .lean(),
      aggregateCountByUsers(AcademicRecord, pageStudentIds),
      aggregateCountByUsers(Project, pageStudentIds),
      aggregateCountByUsers(Internship, pageStudentIds),
      aggregateCountByUsers(Certificate, pageStudentIds),
      aggregateCountByUsers(Achievement, pageStudentIds),
      aggregateCountByUsers(Competition, pageStudentIds),
      aggregateCountByUsers(Activity, pageStudentIds),
      aggregateCountByUsers(Project, pageStudentIds, { verificationStatus: 'verified' }),
      aggregateCountByUsers(Internship, pageStudentIds, { verificationStatus: 'verified' }),
      aggregateCountByUsers(Certificate, pageStudentIds, { verificationStatus: 'verified' }),
      aggregateCountByUsers(Achievement, pageStudentIds, { verificationStatus: 'verified' }),
      aggregateCountByUsers(Competition, pageStudentIds, { verificationStatus: 'verified' }),
      aggregateCountByUsers(Activity, pageStudentIds, { verificationStatus: 'verified' }),
    ]);

    const profileMap = new Map(profileRows.map((profile) => [String(profile.user), profile]));

    const records = students.map((student) => {
      const key = String(student._id);
      const profile = profileMap.get(key);
      const itemCounts = {
        academicRecords: academicMap.get(key) || 0,
        projects: projectMap.get(key) || 0,
        internships: internshipMap.get(key) || 0,
        certificates: certificateMap.get(key) || 0,
        achievements: achievementMap.get(key) || 0,
        competitions: competitionMap.get(key) || 0,
        activities: activityMap.get(key) || 0,
      };

      const verifiedItems =
        (verifiedProjectMap.get(key) || 0) +
        (verifiedInternshipMap.get(key) || 0) +
        (verifiedCertificateMap.get(key) || 0) +
        (verifiedAchievementMap.get(key) || 0) +
        (verifiedCompetitionMap.get(key) || 0) +
        (verifiedActivityMap.get(key) || 0);

      const totalVerifiableItems =
        itemCounts.projects +
        itemCounts.internships +
        itemCounts.certificates +
        itemCounts.achievements +
        itemCounts.competitions +
        itemCounts.activities;

      return {
        id: student._id,
        name: student.name,
        email: student.email,
        createdAt: student.createdAt,
        profile: {
          rollNumber: profile?.rollNumber || '',
          enrollmentNumber: profile?.enrollmentNumber || '',
          department: profile?.department || '',
          course: profile?.course || '',
          academicYear: profile?.academicYear || '',
          semester: profile?.semester || '',
          phone: profile?.phone || '',
        },
        itemCounts,
        verification: {
          totalVerifiableItems,
          verifiedItems,
          verifiedPercent: totalVerifiableItems === 0 ? 0 : Math.round((verifiedItems / totalVerifiableItems) * 100),
        },
      };
    });

    return res.status(200).json({
      records,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        hasNextPage: page * pageSize < total,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getStudentConsolidatedProfile = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({ _id: studentId, role: 'student' }).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const [profile, academicRecords, projects, internships, certificates, achievements, competitions, activities] = await Promise.all([
      StudentProfile.findOne({ user: studentId }).lean(),
      AcademicRecord.find({ user: studentId }).lean().sort({ createdAt: -1 }),
      Project.find({ user: studentId }).lean().sort({ createdAt: -1 }),
      Internship.find({ user: studentId }).lean().sort({ createdAt: -1 }),
      Certificate.find({ user: studentId }).lean().sort({ createdAt: -1 }),
      Achievement.find({ user: studentId }).lean().sort({ createdAt: -1 }),
      Competition.find({ user: studentId }).lean().sort({ createdAt: -1 }),
      Activity.find({ user: studentId }).lean().sort({ createdAt: -1 }),
    ]);

    const itemCounts = {
      academicRecords: academicRecords.length,
      projects: projects.length,
      internships: internships.length,
      certificates: certificates.length,
      achievements: achievements.length,
      competitions: competitions.length,
      activities: activities.length,
    };

    const verifiedItems = [projects, internships, certificates, achievements, competitions, activities]
      .flat()
      .filter((record) => record.verificationStatus === 'verified').length;

    const totalVerifiableItems =
      itemCounts.projects + itemCounts.internships + itemCounts.certificates + itemCounts.achievements + itemCounts.competitions + itemCounts.activities;

    const summary = {
      itemCounts,
      verification: {
        totalVerifiableItems,
        verifiedItems,
        verifiedPercent: totalVerifiableItems === 0 ? 0 : Math.round((verifiedItems / totalVerifiableItems) * 100),
      },
    };

    return res.status(200).json({
      student,
      profile,
      summary,
      records: {
        academicRecords,
        projects,
        internships,
        certificates,
        achievements,
        competitions,
        activities,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getStudentVerifiedProfile = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const student = await User.findOne({ _id: studentId, role: 'student' }).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const [profile, projects, internships, certificates, achievements, competitions, activities] = await Promise.all([
      StudentProfile.findOne({ user: studentId }).lean(),
      Project.find({ user: studentId, verificationStatus: 'verified' }).lean().sort({ createdAt: -1 }),
      Internship.find({ user: studentId, verificationStatus: 'verified' }).lean().sort({ createdAt: -1 }),
      Certificate.find({ user: studentId, verificationStatus: 'verified' }).lean().sort({ createdAt: -1 }),
      Achievement.find({ user: studentId, verificationStatus: 'verified' }).lean().sort({ createdAt: -1 }),
      Competition.find({ user: studentId, verificationStatus: 'verified' }).lean().sort({ createdAt: -1 }),
      Activity.find({ user: studentId, verificationStatus: 'verified' }).lean().sort({ createdAt: -1 }),
    ]);

    return res.status(200).json({
      student,
      profile,
      records: {
        projects,
        internships,
        certificates,
        achievements,
        competitions,
        activities,
      },
    });
  } catch (error) {
    return next(error);
  }
};
