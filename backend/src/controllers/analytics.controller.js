const Order = require('../models/Order.model');
const Restaurant = require('../models/Restaurant.model');
const User = require('../models/User.model');
const Payment = require('../models/Payment.model');
const MenuItem = require('../models/MenuItem.model');
const { AppError } = require('../middlewares/error.middleware');

// ─── Restaurant Analytics ───────────────────────────────
exports.getRestaurantAnalytics = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return next(new AppError('Restaurant not found.', 404));

    const { period = '7d' } = req.query;

    let startDate;
    switch (period) {
      case '1d': startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); break;
      case '7d': startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Revenue over time
    const revenueOverTime = await Order.aggregate([
      {
        $match: {
          restaurant: restaurant._id,
          paymentStatus: 'completed',
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top dishes
    const topDishes = await Order.aggregate([
      {
        $match: { restaurant: restaurant._id, createdAt: { $gte: startDate } },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          totalOrders: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.itemTotal' },
        },
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 },
    ]);

    // Peak hours
    const peakHours = await Order.aggregate([
      {
        $match: { restaurant: restaurant._id, createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { orders: -1 } },
    ]);

    // Order type distribution
    const orderTypeDistribution = await Order.aggregate([
      {
        $match: { restaurant: restaurant._id, createdAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Summary stats
    const totalOrders = await Order.countDocuments({
      restaurant: restaurant._id,
      createdAt: { $gte: startDate },
    });

    const totalRevenue = await Order.aggregate([
      {
        $match: {
          restaurant: restaurant._id,
          paymentStatus: 'completed',
          createdAt: { $gte: startDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } },
    ]);

    const avgOrderValue = totalRevenue[0]
      ? Math.round((totalRevenue[0].total / totalOrders) * 100) / 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0,
          avgOrderValue,
          period,
        },
        revenueOverTime,
        topDishes,
        peakHours,
        orderTypeDistribution,
      },
    });
  } catch (error) { next(error); }
};

// ─── Admin Platform Analytics ───────────────────────────
exports.getPlatformAnalytics = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;

    let startDate;
    switch (period) {
      case '7d': startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      userGrowth, revenueByDay, topRestaurants, orderStats, newUsersToday,
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'completed', createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Restaurant.find().sort({ totalOrders: -1 }).limit(10).select('name totalOrders totalRevenue rating'),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    ]);

    res.status(200).json({
      success: true,
      data: { userGrowth, revenueByDay, topRestaurants, orderStats, newUsersToday },
    });
  } catch (error) { next(error); }
};
