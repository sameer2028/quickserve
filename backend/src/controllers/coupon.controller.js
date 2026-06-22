const Coupon = require('../models/Coupon.model');
const Restaurant = require('../models/Restaurant.model');
const { AppError } = require('../middlewares/error.middleware');

// ─── Get Available Coupons (Public) ─────────────────────
exports.getAvailableCoupons = async (req, res, next) => {
  try {
    const { restaurantId } = req.query;
    const now = new Date();

    const query = {
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
    };

    if (restaurantId) {
      query.$or = [
        { restaurant: restaurantId },
        { applicableTo: 'all' },
        { applicableRestaurants: restaurantId },
      ];
    }

    const coupons = await Coupon.find(query)
      .select('code description type discountValue maxDiscount minOrderAmount validUntil')
      .sort({ discountValue: -1 });

    res.status(200).json({ success: true, data: { coupons } });
  } catch (error) { next(error); }
};

// ─── Validate Coupon ────────────────────────────────────
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal, restaurantId } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return next(new AppError('Invalid coupon code.', 404));

    const { valid, reason } = coupon.isValid();
    if (!valid) return next(new AppError(reason, 400));

    const { canUse, reason: userReason } = coupon.canBeUsedByUser(req.user._id);
    if (!canUse) return next(new AppError(userReason, 400));

    const { discount, reason: discountReason } = coupon.calculateDiscount(subtotal || 0);
    if (discount === 0 && discountReason) return next(new AppError(discountReason, 400));

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        discount,
        coupon: {
          code: coupon.code,
          description: coupon.description,
          type: coupon.type,
          discountValue: coupon.discountValue,
        },
      },
    });
  } catch (error) { next(error); }
};

// ─── Restaurant Owner: Create Coupon ────────────────────
exports.createRestaurantCoupon = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return next(new AppError('Restaurant not found.', 404));

    const coupon = await Coupon.create({
      ...req.body,
      restaurant: restaurant._id,
      applicableTo: 'specific_restaurants',
      applicableRestaurants: [restaurant._id],
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Coupon created.', data: { coupon } });
  } catch (error) { next(error); }
};

// ─── Restaurant Owner: Get My Coupons ───────────────────
exports.getMyRestaurantCoupons = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return next(new AppError('Restaurant not found.', 404));

    const coupons = await Coupon.find({ restaurant: restaurant._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { coupons } });
  } catch (error) { next(error); }
};
