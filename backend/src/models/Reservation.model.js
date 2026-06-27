const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    customer: {
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
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      start: { type: String, required: true }, // e.g. "12:00"
      end: { type: String, required: true },   // e.g. "12:30"
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
    },
    assignedTable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'checked_in', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
    },
    specialRequests: {
      type: String,
      maxlength: 500,
    },
    ownerNotes: {
      type: String,
      maxlength: 500,
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
reservationSchema.index({ restaurant: 1, date: 1 });
reservationSchema.index({ customer: 1, date: 1 });
reservationSchema.index({ status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
