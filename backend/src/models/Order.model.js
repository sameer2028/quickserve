const mongoose = require('mongoose');
const crypto = require('crypto');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
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
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        variant: {
          name: String,
          price: Number,
        },
        addons: [
          {
            name: String,
            price: Number,
            quantity: Number,
          },
        ],
        specialInstructions: String,
        itemTotal: { type: Number, required: true },
      },
    ],
    orderType: {
      type: String,
      enum: ['pickup', 'dine_in', 'delivery'],
      required: [true, 'Order type is required'],
    },
    schedule: {
      isScheduled: { type: Boolean, default: false },
      scheduledAt: Date,
      timeSlot: {
        start: String,
        end: String,
      },
    },
    deliveryAddress: {
      name: String,
      phone: String,
      street: String,
      landmark: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        note: String,
      },
    ],
    pricing: {
      subtotal: { type: Number, required: true },
      tax: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      packagingCharge: { type: Number, default: 0 },
      convenienceFee: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    couponCode: String,
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
    },
    estimatedPrepTime: {
      type: Number, // minutes
    },
    actualPrepTime: {
      type: Number, // minutes
    },
    prepStartedAt: Date,
    readyAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    refundAmount: Number,
    refundedAt: Date,
    specialInstructions: {
      type: String,
      maxlength: [500, 'Instructions cannot exceed 500 characters'],
    },
    qrCode: String,
    otp: {
      code: String,
      expiresAt: Date,
    },
    invoice: {
      url: String,
      generatedAt: Date,
    },
    loyaltyPointsEarned: {
      type: Number,
      default: 0,
    },
    loyaltyPointsUsed: {
      type: Number,
      default: 0,
    },
    isRated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'schedule.scheduledAt': 1 });
orderSchema.index({ paymentStatus: 1 });

// ─── Pre-save: Generate order number ─────────────────────
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.orderNumber = `QS-${dateStr}-${randomStr}`;
  }
  next();
});

// ─── Methods ─────────────────────────────────────────────
orderSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: crypto.createHash('sha256').update(otp).digest('hex'),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
  };
  return otp;
};

orderSchema.methods.verifyOTP = function (otp) {
  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  return this.otp.code === hash && this.otp.expiresAt > Date.now();
};

orderSchema.methods.addStatusHistory = function (status, userId, note) {
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    updatedBy: userId,
    note,
  });
  this.status = status;
};

module.exports = mongoose.model('Order', orderSchema);
