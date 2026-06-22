const Staff = require('../models/Staff.model');
const User = require('../models/User.model');
const Restaurant = require('../models/Restaurant.model');
const { AppError } = require('../middlewares/error.middleware');

// ─── Create Staff Account ───────────────────────────────
exports.createStaff = async (req, res, next) => {
  try {
    const { email, name, password, staffRole, permissions, branchId } = req.body;

    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return next(new AppError('Restaurant not found.', 404));

    // Create or find user
    let user = await User.findOne({ email });
    if (user) {
      // Check if already staff somewhere
      const existingStaff = await Staff.findOne({ user: user._id, isActive: true });
      if (existingStaff) return next(new AppError('This user is already assigned as staff.', 400));
    } else {
      user = await User.create({
        name, email, password,
        role: 'restaurant_staff',
      });
    }

    user.role = 'restaurant_staff';
    await user.save({ validateBeforeSave: false });

    const staff = await Staff.create({
      user: user._id,
      restaurant: restaurant._id,
      branch: branchId,
      staffRole,
      permissions: permissions || undefined,
    });

    await staff.populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Staff account created.',
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Restaurant Staff ───────────────────────────────
exports.getStaff = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return next(new AppError('Restaurant not found.', 404));

    const staff = await Staff.find({ restaurant: restaurant._id, isActive: true })
      .populate('user', 'name email phone avatar')
      .populate('branch', 'name');

    res.status(200).json({
      success: true,
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Staff ───────────────────────────────────────
exports.updateStaff = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const { staffRole, permissions, shift, branchId } = req.body;

    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      {
        ...(staffRole && { staffRole }),
        ...(permissions && { permissions }),
        ...(shift && { shift }),
        ...(branchId && { branch: branchId }),
      },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone');

    if (!staff) return next(new AppError('Staff not found.', 404));

    res.status(200).json({
      success: true,
      message: 'Staff updated.',
      data: { staff },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Remove Staff ───────────────────────────────────────
exports.removeStaff = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      { isActive: false },
      { new: true }
    );

    if (!staff) return next(new AppError('Staff not found.', 404));

    // Revert user role to customer
    await User.findByIdAndUpdate(staff.user, { role: 'customer' });

    res.status(200).json({
      success: true,
      message: 'Staff removed.',
    });
  } catch (error) {
    next(error);
  }
};
