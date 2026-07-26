import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 1. Protect routes for any logged-in user
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]; // Extract token from "Bearer <TOKEN>"
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user object to request (excluding password)
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// 2. Strict check for Vendor-only actions (like toggling menu items)
export const vendorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'vendor') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Vendor privilege required' });
  }
};