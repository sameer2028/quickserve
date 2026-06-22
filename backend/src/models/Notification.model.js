const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'signup', 'order_confirmed', 'order_preparing', 'order_ready',
        'order_delivered', 'order_cancelled', 'payment_success',
        'payment_failed', 'offer', 'general', 'review_reply',
        'refund', 'loyalty_points', 'referral',
      ],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
    },
    data: {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
      couponCode: String,
      link: String,
    },
    channels: {
      email: { sent: { type: Boolean, default: false }, sentAt: Date },
      sms: { sent: { type: Boolean, default: false }, sentAt: Date },
      push: { sent: { type: Boolean, default: false }, sentAt: Date },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
