const Delivery = require('../models/Delivery.model');
const Order = require('../models/Order.model');
const Restaurant = require('../models/Restaurant.model');
const User = require('../models/User.model');
const { AppError } = require('../middlewares/error.middleware');
const crypto = require('crypto');

// ─── Assign Delivery Agent ──────────────────────────────
exports.assignDeliveryAgent = async (req, res, next) => {
  try {
    const { orderId, agentId } = req.body;

    const order = await Order.findById(orderId).populate('restaurant').populate('deliveryAddress');
    if (!order) return next(new AppError('Order not found.', 404));
    if (order.orderType !== 'delivery') return next(new AppError('Order is not a delivery order.', 400));

    const agent = await User.findOne({ _id: agentId, role: 'delivery_agent', isActive: true });
    if (!agent) return next(new AppError('Delivery agent not found.', 404));

    const delivery = await Delivery.create({
      order: order._id,
      agent: agentId,
      restaurant: order.restaurant._id,
      pickupAddress: {
        street: order.restaurant.address?.street,
        city: order.restaurant.address?.city,
        state: order.restaurant.address?.state,
        pincode: order.restaurant.address?.pincode,
        location: order.restaurant.location,
      },
      deliveryAddress: order.deliveryAddress ? {
        street: order.deliveryAddress.addressLine1,
        city: order.deliveryAddress.city,
        state: order.deliveryAddress.state,
        pincode: order.deliveryAddress.pincode,
        location: order.deliveryAddress.location,
      } : undefined,
      deliveryFee: order.pricing.deliveryFee,
      agentEarnings: Math.round(order.pricing.deliveryFee * 0.8 * 100) / 100,
    });

    order.delivery = delivery._id;
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Delivery agent assigned.',
      data: { delivery },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Accept Delivery (Agent) ────────────────────────────
exports.acceptDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findOne({
      _id: req.params.id,
      agent: req.user._id,
      status: 'assigned',
    });

    if (!delivery) return next(new AppError('Delivery not found or already accepted.', 404));

    delivery.status = 'accepted';
    delivery.statusHistory.push({ status: 'accepted', timestamp: new Date() });
    await delivery.save();

    res.status(200).json({
      success: true,
      message: 'Delivery accepted.',
      data: { delivery },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Delivery Status ─────────────────────────────
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status, location, note } = req.body;

    const delivery = await Delivery.findOne({
      _id: req.params.id,
      agent: req.user._id,
    });

    if (!delivery) return next(new AppError('Delivery not found.', 404));

    delivery.status = status;
    delivery.statusHistory.push({
      status,
      timestamp: new Date(),
      location: location ? { type: 'Point', coordinates: location } : undefined,
      note,
    });

    if (location) {
      delivery.currentLocation = { type: 'Point', coordinates: location };
    }

    if (status === 'picked_up') {
      delivery.pickedUpAt = new Date();
      // Update order status
      await Order.findByIdAndUpdate(delivery.order, {
        status: 'out_for_delivery',
        $push: { statusHistory: { status: 'out_for_delivery', timestamp: new Date() } },
      });
    }

    if (status === 'delivered') {
      delivery.deliveredAt = new Date();
      if (delivery.pickedUpAt) {
        delivery.actualDuration = Math.round(
          (delivery.deliveredAt - delivery.pickedUpAt) / 60000
        );
      }
    }

    await delivery.save();

    res.status(200).json({
      success: true,
      message: `Delivery status updated to '${status}'.`,
      data: { delivery },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Verify Delivery OTP ────────────────────────────────
exports.verifyDeliveryOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;

    const delivery = await Delivery.findOne({
      _id: req.params.id,
      agent: req.user._id,
      status: 'in_transit',
    });

    if (!delivery) return next(new AppError('Delivery not found.', 404));

    const order = await Order.findById(delivery.order);
    if (!order.verifyOTP(otp)) {
      return next(new AppError('Invalid or expired OTP.', 400));
    }

    delivery.status = 'delivered';
    delivery.deliveredAt = new Date();
    delivery.statusHistory.push({ status: 'delivered', timestamp: new Date() });
    await delivery.save();

    order.status = 'delivered';
    order.deliveredAt = new Date();
    order.addStatusHistory('delivered', req.user._id, 'Delivered via OTP verification');
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Delivery confirmed via OTP.',
      data: { delivery },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Agent Deliveries ───────────────────────────────
exports.getMyDeliveries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { agent: req.user._id };
    if (status) query.status = status;

    const total = await Delivery.countDocuments(query);
    const deliveries = await Delivery.find(query)
      .populate('order', 'orderNumber items pricing')
      .populate('restaurant', 'name phone address')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        deliveries,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Available Delivery Agents ──────────────────────
exports.getAvailableAgents = async (req, res, next) => {
  try {
    const busyAgentIds = await Delivery.distinct('agent', {
      status: { $in: ['assigned', 'accepted', 'picked_up', 'in_transit'] },
    });

    const agents = await User.find({
      role: 'delivery_agent',
      isActive: true,
      isSuspended: false,
      _id: { $nin: busyAgentIds },
    }).select('name phone avatar');

    res.status(200).json({
      success: true,
      data: { agents },
    });
  } catch (error) {
    next(error);
  }
};
