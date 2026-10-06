const User = require('../models/User');
const Project = require('../models/Project');
const Internship = require('../models/Internship');
const Certificate = require('../models/Certificate');
const Achievement = require('../models/Achievement');
const Competition = require('../models/Competition');
const Activity = require('../models/Activity');

const resources = [
  { key: 'projects', model: Project, label: 'Projects' },
  { key: 'internships', model: Internship, label: 'Internships' },
  { key: 'certificates', model: Certificate, label: 'Certificates' },
  { key: 'achievements', model: Achievement, label: 'Achievements' },
  { key: 'competitions', model: Competition, label: 'Competitions' },
  { key: 'activities', model: Activity, label: 'Activities' },
];

exports.getPlatformAnalytics = async (req, res, next) => {
  try {
    const [students, faculty, admins, activeUsers, inactiveUsers] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
    ]);

    const resourceStats = await Promise.all(
      resources.map(async ({ key, model, label }) => {
        const [total, pending, verified, rejected] = await Promise.all([
          model.countDocuments(),
          model.countDocuments({ verificationStatus: 'pending' }),
          model.countDocuments({ verificationStatus: 'verified' }),
          model.countDocuments({ verificationStatus: 'rejected' }),
        ]);

        return { key, label, total, pending, verified, rejected };
      })
    );

    const monthlySubmissions = await Promise.all(
      resources.map(async ({ key, model }) => {
        const result = await model.aggregate([
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        return {
          resource: key,
          trend: result.map((item) => ({
            year: item._id.year,
            month: item._id.month,
            count: item.count,
          })),
        };
      })
    );

    return res.status(200).json({
      users: {
        students,
        faculty,
        admins,
        activeUsers,
        inactiveUsers,
      },
      resourceStats,
      monthlySubmissions,
    });
  } catch (error) {
    return next(error);
  }
};
