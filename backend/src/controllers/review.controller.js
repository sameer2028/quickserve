const Review = require('../models/Review.model');
const Order = require('../models/Order.model');
const Restaurant = require('../models/Restaurant.model');
const { AppError } = require('../middlewares/error.middleware');
const { uploadToCloudinary } = require('../config/cloudinary');

// ─── Create Review ──────────────────────────────────────
exports.createReview = async (req, res, next) => {
  try {
    const { orderId, rating, title, comment, menuItemId } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      status: 'delivered',
    });

    if (!order) {
      return next(new AppError('Can only review delivered orders.', 400));
    }

    // Check for existing review
    const existingReview = await Review.findOne({ user: req.user._id, order: orderId });
    if (existingReview) {
      return next(new AppError('You have already reviewed this order.', 400));
    }

    const review = await Review.create({
      user: req.user._id,
      restaurant: order.restaurant,
      order: orderId,
      menuItem: menuItemId,
      rating,
      title,
      comment,
    });

    order.isRated = true;
    await order.save();

    await review.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Restaurant Reviews ─────────────────────────────
exports.getRestaurantReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'recent' } = req.query;

    let sort = {};
    switch (sortBy) {
      case 'highest': sort = { rating: -1 }; break;
      case 'lowest': sort = { rating: 1 }; break;
      case 'helpful': sort = { helpfulCount: -1 }; break;
      default: sort = { createdAt: -1 };
    }

    const query = { restaurant: req.params.restaurantId, isActive: true };
    const total = await Review.countDocuments(query);

    const reviews = await Review.find(query)
      .populate('user', 'name avatar')
      .populate('menuItem', 'name')
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Review ──────────────────────────────────────
exports.updateReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;

    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return next(new AppError('Review not found.', 404));
    }

    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    review.isEdited = true;
    review.editedAt = new Date();

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review updated.',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Review ──────────────────────────────────────
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!review) {
      return next(new AppError('Review not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Reply to Review (Restaurant Owner) ─────────────────
exports.replyToReview = async (req, res, next) => {
  try {
    const { text } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(new AppError('Review not found.', 404));
    }

    const restaurant = await Restaurant.findOne({
      _id: review.restaurant,
      owner: req.user._id,
    });

    if (!restaurant) {
      return next(new AppError('Not authorized to reply to this review.', 403));
    }

    review.reply = {
      text,
      repliedBy: req.user._id,
      repliedAt: new Date(),
    };

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Reply posted.',
      data: { review },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Upload Review Images ───────────────────────────────
exports.uploadReviewImages = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) {
      return next(new AppError('Review not found.', 404));
    }

    if (!req.files || req.files.length === 0) {
      return next(new AppError('Please upload images.', 400));
    }

    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path, 'quickserve/reviews');
      review.images.push(result);
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Images uploaded.',
      data: { images: review.images },
    });
  } catch (error) {
    next(error);
  }
};
