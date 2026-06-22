const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
          required: true,
        },
        name: String,
        price: Number,
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity must be at least 1'],
          max: [20, 'Maximum 20 of same item'],
        },
        variant: {
          name: String,
          price: Number,
        },
        addons: [
          {
            name: String,
            price: Number,
            quantity: { type: Number, default: 1 },
          },
        ],
        specialInstructions: {
          type: String,
          maxlength: [200, 'Special instructions cannot exceed 200 characters'],
        },
        itemTotal: Number,
      },
    ],
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    couponCode: String,
    couponDiscount: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    packagingCharge: {
      type: Number,
      default: 0,
    },
    convenienceFee: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Methods ─────────────────────────────────────────────
cartSchema.methods.calculateTotals = async function () {
  let subtotal = 0;

  for (const item of this.items) {
    let itemPrice = item.variant?.price || item.price;
    let addonsTotal = 0;

    if (item.addons && item.addons.length > 0) {
      addonsTotal = item.addons.reduce((sum, addon) => sum + addon.price * (addon.quantity || 1), 0);
    }

    item.itemTotal = (itemPrice + addonsTotal) * item.quantity;
    subtotal += item.itemTotal;
  }

  this.subtotal = Math.round(subtotal * 100) / 100;

  // Get restaurant details for tax and fees
  if (this.restaurant) {
    const Restaurant = mongoose.model('Restaurant');
    const restaurant = await Restaurant.findById(this.restaurant);
    if (restaurant) {
      this.tax = Math.round(this.subtotal * (restaurant.taxRate / 100) * 100) / 100;
      this.packagingCharge = restaurant.packagingCharge || 0;
      this.convenienceFee = restaurant.convenienceFee || 0;
    }
  }

  this.total = Math.round(
    (this.subtotal + this.tax + this.deliveryFee + this.packagingCharge + this.convenienceFee - this.couponDiscount) * 100
  ) / 100;

  if (this.total < 0) this.total = 0;

  return this;
};

cartSchema.index({ user: 1 });

module.exports = mongoose.model('Cart', cartSchema);
