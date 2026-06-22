const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Wallet = require('../models/Wallet.model');
const { AppError } = require('../middlewares/error.middleware');
const { sendEmail, emailTemplates } = require('../utils/email');
const NotificationService = require('../services/notification.service');

// ─── Helper: Set Token Cookies ───────────────────────────
const setTokenCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// ─── Register ────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('An account with this email already exists.', 400));
    }

    // Only allow customer role on public registration
    const allowedRole = role === 'restaurant_owner' ? 'restaurant_owner' : 'customer';

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: allowedRole,
    });

    // Create wallet
    await Wallet.create({ user: user._id });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const template = emailTemplates.emailVerification(user.name, verificationUrl);
    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    // Send welcome notification
    await NotificationService.onSignup(user);

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Store refresh token
    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          referralCode: user.referralCode,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ───────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    if (user.isLocked) {
      return next(new AppError('Account is temporarily locked. Try again later.', 423));
    }

    if (user.isSuspended) {
      return next(new AppError(`Account suspended: ${user.suspendedReason || 'Contact support.'}`, 403));
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment login attempts
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
        user.loginAttempts = 0;
      }
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Invalid email or password.', 401));
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Limit stored refresh tokens to 5 most recent
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens = user.refreshTokens.slice(-4);
    }

    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Refresh Token ───────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    const tokenFromCookie = req.cookies?.refreshToken;
    const token = refreshToken || tokenFromCookie;

    if (!token) {
      return next(new AppError('Refresh token is required.', 401));
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return next(new AppError('Invalid or expired refresh token.', 401));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User not found.', 401));
    }

    // Check if refresh token exists in user's stored tokens
    const storedToken = user.refreshTokens.find((t) => t.token === token);
    if (!storedToken) {
      // Token reuse detected - invalidate all tokens
      user.refreshTokens = [];
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Refresh token not recognized. All sessions have been logged out.', 401));
    }

    // Remove old token and issue new pair
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== token);

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshTokens.push({
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ──────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;

    if (token && req.user) {
      req.user.refreshTokens = req.user.refreshTokens.filter((t) => t.token !== token);
      await req.user.save({ validateBeforeSave: false });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Email ────────────────────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Invalid or expired verification token.', 400));
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot Password ────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('No account found with that email.', 404));
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const template = emailTemplates.passwordReset(user.name, resetUrl);

    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reset Password ─────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Invalid or expired reset token.', 400));
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    user.refreshTokens = []; // Logout all sessions
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Google OAuth Callback ───────────────────────────────
exports.googleCallback = async (req, res, next) => {
  try {
    const user = req.user;

    // Ensure wallet exists
    const existingWallet = await Wallet.findOne({ user: user._id });
    if (!existingWallet) {
      await Wallet.create({ user: user._id });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);

    // Redirect to frontend with tokens
    res.redirect(
      `${process.env.CLIENT_URL}/auth/google/success?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/auth/google/error`);
  }
};

// ─── Get Current User ────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('addresses')
      .populate('defaultAddress')
      .populate('wallet');

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Resend Verification Email ───────────────────────────
exports.resendVerification = async (req, res, next) => {
  try {
    const user = req.user;

    if (user.isEmailVerified) {
      return next(new AppError('Email is already verified.', 400));
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const template = emailTemplates.emailVerification(user.name, verificationUrl);
    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    res.status(200).json({
      success: true,
      message: 'Verification email resent.',
    });
  } catch (error) {
    next(error);
  }
};
