const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    type: {
      type: String,
      enum: ['percentage', 'flat', 'first_order', 'festival'],
      required: [true, 'Coupon type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount cannot be negative'],
    },
    maxDiscount: {
      type: Number, // Cap for percentage discounts
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      // null = platform-wide coupon
    },
    validFrom: {
      type: Date,
      required: [true, 'Valid from date is required'],
    },
    validUntil: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        usedAt: { type: Date, default: Date.now },
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Order',
        },
      },
    ],
    applicableTo: {
      type: String,
      enum: ['all', 'new_users', 'specific_restaurants'],
      default: 'all',
    },
    applicableRestaurants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
couponSchema.index({ restaurant: 1 });

// ─── Methods ─────────────────────────────────────────────
couponSchema.methods.isValid = function () {
  const now = new Date();
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
  if (now < this.validFrom) return { valid: false, reason: 'Coupon is not yet active' };
  if (now > this.validUntil) return { valid: false, reason: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, reason: 'Coupon usage limit reached' };
  }
  return { valid: true };
};

couponSchema.methods.canBeUsedByUser = function (userId) {
  const userUsage = this.usedBy.filter(
    (u) => u.user.toString() === userId.toString()
  ).length;
  if (userUsage >= this.perUserLimit) {
    return { canUse: false, reason: 'You have already used this coupon the maximum number of times' };
  }
  return { canUse: true };
};

couponSchema.methods.calculateDiscount = function (subtotal) {
  if (subtotal < this.minOrderAmount) {
    return { discount: 0, reason: `Minimum order amount is ₹${this.minOrderAmount}` };
  }

  let discount = 0;
  if (this.type === 'percentage') {
    discount = (subtotal * this.discountValue) / 100;
    if (this.maxDiscount) {
      discount = Math.min(discount, this.maxDiscount);
    }
  } else {
    discount = this.discountValue;
  }

  discount = Math.min(discount, subtotal);
  return { discount: Math.round(discount * 100) / 100 };
};

module.exports = mongoose.model('Coupon', couponSchema);
