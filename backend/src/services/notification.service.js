const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const { sendEmail, emailTemplates } = require('../utils/email');
const { sendSMS, smsTemplates } = require('../utils/sms');
const { sendPushNotification, pushPayloads } = require('../utils/pushNotification');

class NotificationService {
  // ─── Create and Send Notification ─────────────────────
  static async send({ userId, type, title, message, data = {}, channels = {} }) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      // Create notification record
      const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        data,
      });

      // Send via email
      if (channels.email !== false && user.email) {
        const emailResult = await sendEmail({
          to: user.email,
          subject: title,
          html: channels.emailHtml || `<p>${message}</p>`,
        });
        notification.channels.email = {
          sent: emailResult.success,
          sentAt: new Date(),
        };
      }

      // Send via SMS
      if (channels.sms && user.phone) {
        const smsResult = await sendSMS({
          to: user.phone,
          message: channels.smsMessage || message,
        });
        notification.channels.sms = {
          sent: smsResult.success,
          sentAt: new Date(),
        };
      }

      // Send via Push
      if (channels.push !== false && user.pushSubscription) {
        const pushResult = await sendPushNotification(user.pushSubscription, {
          title,
          body: message,
          data: { url: data.link || '/', ...data },
        });
        notification.channels.push = {
          sent: pushResult.success,
          sentAt: new Date(),
        };
      }

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Notification send error:', error.message);
      return null;
    }
  }

  // ─── Pre-built Notification Senders ───────────────────
  static async onSignup(user) {
    const template = emailTemplates.welcome(user.name);
    return this.send({
      userId: user._id,
      type: 'signup',
      title: 'Welcome to QuickServe! 🎉',
      message: `Welcome aboard, ${user.name}! Start pre-ordering your favorite meals.`,
      channels: {
        emailHtml: template.html,
        sms: true,
        smsMessage: smsTemplates.welcome(user.name),
      },
    });
  }

  static async onOrderConfirmed(order, user) {
    const template = emailTemplates.orderConfirmation(user.name, order);
    return this.send({
      userId: user._id,
      type: 'order_confirmed',
      title: `Order Confirmed - #${order.orderNumber}`,
      message: `Your order #${order.orderNumber} has been confirmed!`,
      data: { orderId: order._id, link: `/orders/${order._id}` },
      channels: {
        emailHtml: template.html,
        sms: true,
        smsMessage: smsTemplates.orderConfirmed(order.orderNumber),
      },
    });
  }

  static async onOrderPreparing(order, user) {
    const template = emailTemplates.orderStatusUpdate(user.name, order, 'preparing');
    return this.send({
      userId: user._id,
      type: 'order_preparing',
      title: `Order Being Prepared - #${order.orderNumber}`,
      message: `Your order #${order.orderNumber} is now being prepared! 👨‍🍳`,
      data: { orderId: order._id, link: `/orders/${order._id}` },
      channels: {
        emailHtml: template.html,
        sms: false,
      },
    });
  }

  static async onOrderReady(order, user) {
    const template = emailTemplates.orderStatusUpdate(user.name, order, 'ready_for_pickup');
    return this.send({
      userId: user._id,
      type: 'order_ready',
      title: `Order Ready! - #${order.orderNumber}`,
      message: `Your order #${order.orderNumber} is ready for pickup! 🎉`,
      data: { orderId: order._id, link: `/orders/${order._id}` },
      channels: {
        emailHtml: template.html,
        sms: true,
        smsMessage: smsTemplates.orderReady(order.orderNumber),
      },
    });
  }

  static async onOrderDelivered(order, user) {
    const template = emailTemplates.orderStatusUpdate(user.name, order, 'delivered');
    return this.send({
      userId: user._id,
      type: 'order_delivered',
      title: `Order Delivered! - #${order.orderNumber}`,
      message: `Your order #${order.orderNumber} has been delivered. Enjoy! 🍽️`,
      data: { orderId: order._id, link: `/orders/${order._id}` },
      channels: {
        emailHtml: template.html,
        sms: true,
        smsMessage: smsTemplates.orderDelivered(order.orderNumber),
      },
    });
  }

  static async onPaymentSuccess(order, user) {
    return this.send({
      userId: user._id,
      type: 'payment_success',
      title: `Payment Successful - ₹${order.pricing.total}`,
      message: `Payment of ₹${order.pricing.total} for order #${order.orderNumber} was successful.`,
      data: { orderId: order._id },
      channels: { sms: false },
    });
  }

  static async onOrderCancelled(order, user) {
    return this.send({
      userId: user._id,
      type: 'order_cancelled',
      title: `Order Cancelled - #${order.orderNumber}`,
      message: `Your order #${order.orderNumber} has been cancelled.`,
      data: { orderId: order._id },
      channels: { sms: true, smsMessage: `Your QuickServe order #${order.orderNumber} has been cancelled.` },
    });
  }

  // ─── Get User Notifications ───────────────────────────
  static async getUserNotifications(userId, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ user: userId });
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    return { notifications, total, unreadCount, page, pages: Math.ceil(total / limit) };
  }

  // ─── Mark as Read ─────────────────────────────────────
  static async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  static async markAllAsRead(userId) {
    return Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }
}

module.exports = NotificationService;
