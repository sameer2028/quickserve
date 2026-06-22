const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    reply: {
      text: String,
      repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      repliedAt: Date,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews per order
reviewSchema.index({ user: 1, order: 1 }, { unique: true });
reviewSchema.index({ restaurant: 1, rating: -1 });
reviewSchema.index({ menuItem: 1 });

// ─── Static: Calculate average rating ─────────────────────
reviewSchema.statics.calculateAverageRating = async function (restaurantId) {
  const stats = await this.aggregate([
    { $match: { restaurant: restaurantId, isActive: true } },
    {
      $group: {
        _id: '$restaurant',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const Restaurant = mongoose.model('Restaurant');
  if (stats.length > 0) {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      'rating.average': Math.round(stats[0].averageRating * 10) / 10,
      'rating.count': stats[0].totalReviews,
    });
  } else {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      'rating.average': 0,
      'rating.count': 0,
    });
  }
};

// Update rating after save
reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.restaurant);
});

// Update rating after delete
reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) {
    doc.constructor.calculateAverageRating(doc.restaurant);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
