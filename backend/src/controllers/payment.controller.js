const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment.model');
const Order = require('../models/Order.model');
const Wallet = require('../models/Wallet.model');
const { AppError } = require('../middlewares/error.middleware');
const NotificationService = require('../services/notification.service');

// ─── Create Payment Intent ──────────────────────────────
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId, paymentMethod } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      paymentStatus: 'pending',
    });

    if (!order) {
      return next(new AppError('Order not found or already paid.', 404));
    }

    // Wallet payment
    if (paymentMethod === 'wallet') {
      const wallet = await Wallet.findOne({ user: req.user._id });
      if (!wallet || wallet.balance < order.pricing.total) {
        return next(new AppError('Insufficient wallet balance.', 400));
      }

      wallet.debit(order.pricing.total, `Payment for order #${order.orderNumber}`, {
        model: 'Order',
        id: order._id,
      });
      await wallet.save();

      const payment = await Payment.create({
        order: order._id,
        user: req.user._id,
        restaurant: order.restaurant,
        amount: order.pricing.total,
        method: 'wallet',
        status: 'completed',
        paidAt: new Date(),
        transactionId: `WLT-${Date.now()}`,
      });

      order.payment = payment._id;
      order.paymentStatus = 'completed';
      order.addStatusHistory('confirmed', req.user._id, 'Payment via wallet');
      await order.save();

      await NotificationService.onPaymentSuccess(order, req.user);

      return res.status(200).json({
        success: true,
        message: 'Payment successful via wallet.',
        data: { payment, order },
      });
    }

    // Stripe payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.pricing.total * 100), // Convert to paise
      currency: 'inr',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
        orderNumber: order.orderNumber,
      },
      payment_method_types: ['card'],
    });

    // Create payment record
    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      restaurant: order.restaurant,
      amount: order.pricing.total,
      method: paymentMethod || 'card',
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
    });

    order.payment = payment._id;
    await order.save();

    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentId: payment._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Confirm Payment ────────────────────────────────────
exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment) {
      return next(new AppError('Payment record not found.', 404));
    }

    if (paymentIntent.status === 'succeeded') {
      payment.status = 'completed';
      payment.paidAt = new Date();
      payment.stripeChargeId = paymentIntent.latest_charge;
      await payment.save();

      const order = await Order.findById(payment.order).populate('user', 'name email phone');
      order.paymentStatus = 'completed';
      order.addStatusHistory('confirmed', req.user._id, 'Payment confirmed');
      await order.save();

      await NotificationService.onPaymentSuccess(order, order.user);

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed.',
        data: { payment, order },
      });
    }

    payment.status = 'failed';
    payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
    await payment.save();

    res.status(400).json({
      success: false,
      message: 'Payment failed.',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Stripe Webhook ─────────────────────────────────────
exports.stripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const payment = await Payment.findOne({ stripePaymentIntentId: pi.id });
        if (payment && payment.status !== 'completed') {
          payment.status = 'completed';
          payment.paidAt = new Date();
          payment.stripeChargeId = pi.latest_charge;
          await payment.save();

          const order = await Order.findById(payment.order).populate('user');
          if (order) {
            order.paymentStatus = 'completed';
            if (order.status === 'pending') {
              order.addStatusHistory('confirmed', null, 'Payment via Stripe webhook');
            }
            await order.save();
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const payment = await Payment.findOne({ stripePaymentIntentId: pi.id });
        if (payment) {
          payment.status = 'failed';
          payment.failureReason = pi.last_payment_error?.message;
          await payment.save();
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};

// ─── Refund Payment ─────────────────────────────────────
exports.refundPayment = async (req, res, next) => {
  try {
    const { orderId, reason, amount } = req.body;

    const order = await Order.findById(orderId).populate('payment');
    if (!order) {
      return next(new AppError('Order not found.', 404));
    }

    const payment = await Payment.findById(order.payment);
    if (!payment || payment.status !== 'completed') {
      return next(new AppError('No completed payment found for this order.', 400));
    }

    const refundAmount = amount || payment.amount;

    if (payment.method === 'wallet') {
      const wallet = await Wallet.findOne({ user: payment.user });
      wallet.refund(refundAmount, `Refund for order #${order.orderNumber}`, {
        model: 'Order',
        id: order._id,
      });
      await wallet.save();
    } else {
      // Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: Math.round(refundAmount * 100),
        reason: 'requested_by_customer',
      });
      payment.refundId = refund.id;
    }

    payment.status = 'refunded';
    payment.refundAmount = refundAmount;
    payment.refundReason = reason;
    payment.refundedAt = new Date();
    await payment.save();

    order.paymentStatus = 'refunded';
    order.refundAmount = refundAmount;
    order.refundedAt = new Date();
    order.addStatusHistory('refunded', req.user._id, reason);
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully.',
      data: { payment, order },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Payment History ────────────────────────────────
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('order', 'orderNumber status')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (error) {
    next(error);
  }
};
