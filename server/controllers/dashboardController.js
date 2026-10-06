const AcademicRecord = require('../models/AcademicRecord');
const Project = require('../models/Project');
const Internship = require('../models/Internship');
const Certificate = require('../models/Certificate');
const Achievement = require('../models/Achievement');
const Competition = require('../models/Competition');
const Activity = require('../models/Activity');

const mapRecentRecord = (module, record, title) => ({
  id: record._id,
  module,
  title,
  createdAt: record.createdAt,
});

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const userFilter = { user: req.user._id };

    const [
      academicRecordCount,
      projectCount,
      internshipCount,
      certificateCount,
      achievementCount,
      competitionCount,
      activityCount,
      projects,
      internships,
      certificates,
      achievements,
      competitions,
      activities,
    ] = await Promise.all([
      AcademicRecord.countDocuments(userFilter),
      Project.countDocuments(userFilter),
      Internship.countDocuments(userFilter),
      Certificate.countDocuments(userFilter),
      Achievement.countDocuments(userFilter),
      Competition.countDocuments(userFilter),
      Activity.countDocuments(userFilter),
      Project.find(userFilter).select('title createdAt').lean().sort({ createdAt: -1 }).limit(4),
      Internship.find(userFilter).select('organization role createdAt').lean().sort({ createdAt: -1 }).limit(4),
      Certificate.find(userFilter).select('title createdAt').lean().sort({ createdAt: -1 }).limit(4),
      Achievement.find(userFilter).select('title createdAt').lean().sort({ createdAt: -1 }).limit(4),
      Competition.find(userFilter).select('competitionName createdAt').lean().sort({ createdAt: -1 }).limit(4),
      Activity.find(userFilter).select('activityType activityName createdAt').lean().sort({ createdAt: -1 }).limit(4),
    ]);

    const recentRecords = [
      ...projects.map((record) => mapRecentRecord('project', record, record.title)),
      ...internships.map((record) => mapRecentRecord('internship', record, `${record.organization} - ${record.role}`)),
      ...certificates.map((record) => mapRecentRecord('certificate', record, record.title)),
      ...achievements.map((record) => mapRecentRecord('achievement', record, record.title)),
      ...competitions.map((record) => mapRecentRecord('competition', record, record.competitionName)),
      ...activities.map((record) => mapRecentRecord('activity', record, `${record.activityType}: ${record.activityName}`)),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);

    return res.status(200).json({
      counts: {
        academicRecords: academicRecordCount,
        projects: projectCount,
        internships: internshipCount,
        certificates: certificateCount,
        achievements: achievementCount,
        competitions: competitionCount,
        activities: activityCount,
      },
      recentRecords,
    });
  } catch (error) {
    return next(error);
  }
};
