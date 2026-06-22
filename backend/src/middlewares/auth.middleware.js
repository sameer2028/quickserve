const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { AppError } = require('./error.middleware');

// ─── Protect Route (Require Authentication) ──────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookies
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('Not authorized. Please log in.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new AppError('User not found. Token is invalid.', 401));
    }

    if (!user.isActive || user.isSuspended) {
      return next(new AppError('Your account has been suspended. Contact support.', 403));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please refresh your token.', 401));
    }
    next(error);
  }
};

// ─── Authorize Roles ─────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized. Please log in.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role '${req.user.role}' is not authorized to access this resource.`, 403)
      );
    }

    next();
  };
};

// ─── Optional Auth (for public routes that benefit from user context) ─
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (error) {
    // Silently continue without user context
  }

  next();
};

// ─── Verify Email Required ───────────────────────────────
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return next(new AppError('Please verify your email address first.', 403));
  }
  next();
};

// ─── Staff Permission Check ─────────────────────────────
const checkStaffPermission = (permission) => {
  return async (req, res, next) => {
    if (req.user.role === 'restaurant_owner' || req.user.role === 'super_admin') {
      return next(); // Owners and admins have all permissions
    }

    if (req.user.role !== 'restaurant_staff') {
      return next(new AppError('Not authorized as staff.', 403));
    }

    const Staff = require('../models/Staff.model');
    const staff = await Staff.findOne({ user: req.user._id, isActive: true });

    if (!staff) {
      return next(new AppError('Staff record not found.', 404));
    }

    if (!staff.permissions[permission]) {
      return next(new AppError(`You don't have permission to ${permission}.`, 403));
    }

    req.staff = staff;
    next();
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  requireEmailVerification,
  checkStaffPermission,
};
