import User from '../models/User.js';
import generateToken from '../config/generateToken.js';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const isValidEmail = (email) => EMAIL_REGEX.test(String(email || '').trim());

// @desc    Register a new student (vendor signup is disabled)
// @route   POST /api/auth/register
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, monthlyBudget } = req.body;

    if (role === 'vendor') {
      return res.status(403).json({
        message: 'Vendor accounts cannot be created from signup. Use a seeded vendor login.',
      });
    }

    if (role && role !== 'student') {
      return res.status(400).json({ message: 'Please register as a Student' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email (e.g. name@college.edu)' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: 'student',
      monthlyBudget: monthlyBudget || 1500,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        monthlyBudget: user.monthlyBudget,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token (Login) — role must match (student | vendor)
// @route   POST /api/auth/login
export const loginUser = async (req, res, next) => {
  try {
    let { email, password, role } = req.body;

    // Default to student if not provided for backward compatibility
    if (!role) {
      role = 'student';
    }

    if (!['student', 'vendor'].includes(role)) {
      return res.status(400).json({ message: 'Please select Student or Vendor to log in' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email (e.g. name@college.edu)' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).populate('room');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role !== role) {
      return res.status(403).json({
        message:
          role === 'vendor'
            ? 'This account is not a vendor. Switch to Student to log in.'
            : 'This account is a Vendor. Switch to Vendor (Bhaiya) to log in.',
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      monthlyBudget: user.monthlyBudget,
      room: user.room,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};
