const User = require('../models/User.model');
const Address = require('../models/Address.model');
const { AppError } = require('../middlewares/error.middleware');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// ─── Get Profile ─────────────────────────────────────────
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('addresses')
      .populate('defaultAddress')
      .populate('favoriteRestaurants', 'name slug logo rating cuisine');

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// ─── Update Profile ──────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Avatar ───────────────────────────────────────
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload an image.', 400));
    }

    const user = await User.findById(req.user._id);

    // Delete old avatar
    if (user.avatar?.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    const result = await uploadToCloudinary(req.file.path, 'quickserve/avatars');
    user.avatar = result;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully.',
      data: { avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Change Password ─────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user.password) {
      return next(new AppError('You signed up with Google. Set a password from forgot password.', 400));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect.', 400));
    }

    user.password = newPassword;
    user.refreshTokens = []; // Logout other sessions
    await user.save();

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshTokens.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
      data: { accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Add Address ─────────────────────────────────────────
exports.addAddress = async (req, res, next) => {
  try {
    const address = await Address.create({
      ...req.body,
      user: req.user._id,
    });

    // Add to user's addresses
    await User.findByIdAndUpdate(req.user._id, {
      $push: { addresses: address._id },
    });

    // Set as default if it's the first address
    const user = await User.findById(req.user._id);
    if (user.addresses.length === 1) {
      user.defaultAddress = address._id;
      address.isDefault = true;
      await address.save();
      await user.save({ validateBeforeSave: false });
    }

    res.status(201).json({
      success: true,
      message: 'Address added successfully.',
      data: { address },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Address ──────────────────────────────────────
exports.updateAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.addressId, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!address) {
      return next(new AppError('Address not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      data: { address },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Address ──────────────────────────────────────
exports.deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.addressId,
      user: req.user._id,
    });

    if (!address) {
      return next(new AppError('Address not found.', 404));
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { addresses: address._id },
    });

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Addresses ───────────────────────────────────────
exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1 });

    res.status(200).json({
      success: true,
      data: { addresses },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Toggle Favorite Restaurant ──────────────────────────
exports.toggleFavoriteRestaurant = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const user = await User.findById(req.user._id);

    const index = user.favoriteRestaurants.indexOf(restaurantId);
    if (index > -1) {
      user.favoriteRestaurants.splice(index, 1);
    } else {
      user.favoriteRestaurants.push(restaurantId);
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: index > -1 ? 'Removed from favorites.' : 'Added to favorites.',
      data: { favoriteRestaurants: user.favoriteRestaurants },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Favorite Restaurants ────────────────────────────
exports.getFavoriteRestaurants = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favoriteRestaurants',
      select: 'name slug logo coverImage rating cuisine avgCostForTwo foodType features',
      match: { isActive: true, isBanned: false },
    });

    res.status(200).json({
      success: true,
      data: { restaurants: user.favoriteRestaurants },
    });
  } catch (error) {
    next(error);
  }
};
