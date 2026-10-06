const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { writeAuditLog } = require('../utils/auditLogger');

const tokenSecret = process.env.JWT_SECRET || 'studenthub-dev-secret';

const sanitizeUser = (user) => {
  if (!user) return null;
  const userObject = user.toObject ? user.toObject() : user;
  delete userObject.password;
  return userObject;
};

const issueToken = (userId) => {
  return jwt.sign({ userId }, tokenSecret, { expiresIn: '7d' });
};

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, adminSecret } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const normalizedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedName || normalizedName.length < 2) {
      return res.status(400).json({ message: 'Please enter a valid full name.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const selectedRole = role === 'faculty' || role === 'admin' || role === 'student' ? role : 'student';

    if (selectedRole === 'admin') {
      const expectedSecret = process.env.ADMIN_REGISTRATION_SECRET;
      if (!expectedSecret || String(adminSecret) !== expectedSecret) {
        return res.status(403).json({ message: 'Admin registration is protected. Provide the admin registration secret.' });
      }
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account already exists with that email address.' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const newUser = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: selectedRole,
    });

    if (newUser.role === 'student') {
      await StudentProfile.findOneAndUpdate(
        { user: newUser._id },
        { user: newUser._id },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }

    const token = issueToken(newUser._id);
    setAuthCookie(res, token);

    await writeAuditLog({
      req,
      actor: newUser,
      action: 'auth.register',
      resourceType: 'user',
      resourceId: newUser._id,
      metadata: { role: newUser.role, email: newUser.email },
    });

    return res.status(201).json({
      message: 'Account created successfully.',
      user: sanitizeUser(newUser),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact the administrator.' });
    }

    const token = issueToken(user._id);
    setAuthCookie(res, token);

    await writeAuditLog({
      req,
      actor: user,
      action: 'auth.login',
      resourceType: 'user',
      resourceId: user._id,
    });

    return res.status(200).json({
      message: 'Login successful.',
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully.' });
};

exports.getMe = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const decoded = jwt.verify(token, tokenSecret);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact the administrator.' });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired session.' });
    }

    next(error);
  }
};
