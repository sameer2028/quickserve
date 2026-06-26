const mongoose = require('mongoose');

const restaurantApplicationSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    cuisine: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'approved', 'rejected'],
      default: 'pending',
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RestaurantApplication', restaurantApplicationSchema);
