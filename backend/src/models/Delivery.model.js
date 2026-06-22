const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    pickupAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
      },
    },
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: [Number],
      },
    },
    status: {
      type: String,
      enum: ['assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'failed'],
      default: 'assigned',
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        location: {
          type: { type: String, enum: ['Point'], default: 'Point' },
          coordinates: [Number],
        },
        note: String,
      },
    ],
    estimatedDistance: {
      type: Number, // km
    },
    estimatedDuration: {
      type: Number, // minutes
    },
    actualDuration: Number,
    pickedUpAt: Date,
    deliveredAt: Date,
    otp: {
      code: String,
      expiresAt: Date,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    agentEarnings: {
      type: Number,
      default: 0,
    },
    route: {
      type: mongoose.Schema.Types.Mixed, // Store route data
    },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
    failureReason: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

deliverySchema.index({ order: 1 });
deliverySchema.index({ agent: 1, status: 1 });
deliverySchema.index({ 'pickupAddress.location': '2dsphere' });
deliverySchema.index({ 'deliveryAddress.location': '2dsphere' });
deliverySchema.index({ 'currentLocation': '2dsphere' });

module.exports = mongoose.model('Delivery', deliverySchema);
