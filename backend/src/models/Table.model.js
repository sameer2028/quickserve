const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    tableNumber: {
      type: String,
      required: [true, 'Table number/name is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Table capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'occupied', 'cleaning'],
      default: 'available',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate table numbers in the same restaurant
tableSchema.index({ restaurant: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
