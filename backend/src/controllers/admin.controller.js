const User = require('../models/User.model');
const Restaurant = require('../models/Restaurant.model');
const Order = require('../models/Order.model');
const Payment = require('../models/Payment.model');
const Coupon = require('../models/Coupon.model');
const Review = require('../models/Review.model');
const { AppError } = require('../middlewares/error.middleware');

// ═══════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════

exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, status } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status === 'suspended') query.isSuspended = true;
    if (status === 'active') query.isActive = true;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({ success: true, data: { users, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } } });
  } catch (error) { next(error); }
};

exports.suspendUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, {
      isSuspended: true, suspendedReason: reason, refreshTokens: [],
    }, { new: true });

    if (!user) return next(new AppError('User not found.', 404));

    res.status(200).json({ success: true, message: 'User suspended.', data: { user } });
  } catch (error) { next(error); }
};

exports.unsuspendUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      isSuspended: false, suspendedReason: undefined,
    }, { new: true });

    if (!user) return next(new AppError('User not found.', 404));

    res.status(200).json({ success: true, message: 'User unsuspended.', data: { user } });
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════
// RESTAURANT MANAGEMENT
// ═══════════════════════════════════════════════════════════

exports.getAllRestaurants = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query = {};

    if (status === 'banned') query.isBanned = true;
    if (status === 'verified') query.isVerified = true;
    if (status === 'unverified') query.isVerified = false;
    if (search) query.$text = { $search: search };

    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({ success: true, data: { restaurants, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } } });
  } catch (error) { next(error); }
};

exports.verifyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!restaurant) return next(new AppError('Restaurant not found.', 404));

    res.status(200).json({ success: true, message: 'Restaurant verified.', data: { restaurant } });
  } catch (error) { next(error); }
};

exports.banRestaurant = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, {
      isBanned: true, bannedReason: reason, isActive: false,
    }, { new: true });

    if (!restaurant) return next(new AppError('Restaurant not found.', 404));

    res.status(200).json({ success: true, message: 'Restaurant banned.', data: { restaurant } });
  } catch (error) { next(error); }
};

exports.unbanRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, {
      isBanned: false, bannedReason: undefined, isActive: true,
    }, { new: true });

    if (!restaurant) return next(new AppError('Restaurant not found.', 404));

    res.status(200).json({ success: true, message: 'Restaurant unbanned.', data: { restaurant } });
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════
// ORDER MANAGEMENT
// ═══════════════════════════════════════════════════════════

exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, dateFrom, dateTo } = req.query;
    const query = {};

    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({ success: true, data: { orders, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } } });
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════
// COUPON MANAGEMENT
// ═══════════════════════════════════════════════════════════

exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });

    res.status(201).json({ success: true, message: 'Coupon created.', data: { coupon } });
  } catch (error) { next(error); }
};

exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { coupons } });
  } catch (error) { next(error); }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return next(new AppError('Coupon not found.', 404));

    res.status(200).json({ success: true, message: 'Coupon updated.', data: { coupon } });
  } catch (error) { next(error); }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!coupon) return next(new AppError('Coupon not found.', 404));

    res.status(200).json({ success: true, message: 'Coupon deactivated.' });
  } catch (error) { next(error); }
};

// ═══════════════════════════════════════════════════════════
// SYSTEM STATISTICS
// ═══════════════════════════════════════════════════════════

exports.getSystemStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalRestaurants, totalOrders, totalRevenue,
      activeOrders, todayOrders, pendingVerifications,
    ] = await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments(),
      Order.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Order.countDocuments({ status: { $in: ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'] } }),
      Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Restaurant.countDocuments({ isVerified: false, isBanned: false }),
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalRestaurants,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        activeOrders,
        todayOrders,
        pendingVerifications,
        usersByRole: Object.fromEntries(usersByRole.map((r) => [r._id, r.count])),
        ordersByStatus: Object.fromEntries(ordersByStatus.map((s) => [s._id, s.count])),
      },
    });
  } catch (error) { next(error); }
};

// ─── Complaints ─────────────────────────────────────────
exports.getComplaints = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reportCount: { $gt: 0 } })
      .populate('user', 'name email')
      .populate('restaurant', 'name')
      .sort({ reportCount: -1 });

    res.status(200).json({ success: true, data: { complaints: reviews } });
  } catch (error) { next(error); }
};
