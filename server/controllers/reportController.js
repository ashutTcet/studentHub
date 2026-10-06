const PDFDocument = require('pdfkit');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AcademicRecord = require('../models/AcademicRecord');
const Project = require('../models/Project');
const Internship = require('../models/Internship');
const Certificate = require('../models/Certificate');
const Achievement = require('../models/Achievement');
const Competition = require('../models/Competition');
const Activity = require('../models/Activity');
const { writeAuditLog } = require('../utils/auditLogger');

const getSectionCounts = async (studentId) => {
  const filter = { user: studentId };
  const [academicRecords, projects, internships, certificates, achievements, competitions, activities] = await Promise.all([
    AcademicRecord.countDocuments(filter),
    Project.countDocuments(filter),
    Internship.countDocuments(filter),
    Certificate.countDocuments(filter),
    Achievement.countDocuments(filter),
    Competition.countDocuments(filter),
    Activity.countDocuments(filter),
  ]);

  return { academicRecords, projects, internships, certificates, achievements, competitions, activities };
};

exports.downloadStudentReport = async (req, res, next) => {
  try {
    const requestedStudentId = req.params.studentId || req.user._id;
    const canAccessOtherProfiles = req.user.role === 'admin' || req.user.role === 'faculty';

    if (!canAccessOtherProfiles && String(requestedStudentId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You do not have permission to generate this report.' });
    }

    const student = await User.findOne({ _id: requestedStudentId, role: 'student' }).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    const [profile, counts] = await Promise.all([StudentProfile.findOne({ user: requestedStudentId }), getSectionCounts(requestedStudentId)]);

    const fileName = `student-report-${String(student._id)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(20).text('StudentHub Consolidated Profile Report');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#555').text(`Generated at: ${new Date().toISOString()}`);
    doc.fillColor('#111');
    doc.moveDown();

    doc.fontSize(14).text('Student Identity', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11).text(`Name: ${student.name}`);
    doc.text(`Email: ${student.email}`);
    doc.text(`Role: ${student.role}`);
    doc.moveDown();

    doc.fontSize(14).text('Profile Details', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11).text(`Roll Number: ${profile?.rollNumber || '-'}`);
    doc.text(`Enrollment Number: ${profile?.enrollmentNumber || '-'}`);
    doc.text(`Department: ${profile?.department || '-'}`);
    doc.text(`Course: ${profile?.course || '-'}`);
    doc.text(`Academic Year: ${profile?.academicYear || '-'}`);
    doc.text(`Semester: ${profile?.semester || '-'}`);
    doc.text(`Phone: ${profile?.phone || '-'}`);
    doc.moveDown();

    doc.fontSize(14).text('Academic and Activity Summary', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11).text(`Academic Records: ${counts.academicRecords}`);
    doc.text(`Projects: ${counts.projects}`);
    doc.text(`Internships: ${counts.internships}`);
    doc.text(`Certificates: ${counts.certificates}`);
    doc.text(`Achievements: ${counts.achievements}`);
    doc.text(`Competitions: ${counts.competitions}`);
    doc.text(`Sports and Cultural Activities: ${counts.activities}`);

    doc.end();

    await writeAuditLog({
      req,
      actor: req.user,
      action: 'report.download',
      resourceType: 'student-report',
      resourceId: student._id,
      metadata: { requestedStudentId: student._id },
    });
  } catch (error) {
    return next(error);
  }
};
