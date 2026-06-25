const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Restaurant = require('../models/Restaurant.model');
const MenuItem = require('../models/MenuItem.model');
const Coupon = require('../models/Coupon.model');
const KitchenQueue = require('../models/KitchenQueue.model');
const { AppError } = require('../middlewares/error.middleware');
const NotificationService = require('../services/notification.service');
const { generateInvoice, generateQRCode } = require('../utils/helpers');

// ─── Create Order (Checkout) ─────────────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    const { orderType, schedule, deliveryAddress, specialInstructions, paymentMethod } = req.body;

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('restaurant');
    if (!cart || cart.items.length === 0) {
      return next(new AppError('Cart is empty.', 400));
    }

    const restaurant = await Restaurant.findById(cart.restaurant);
    if (!restaurant || !restaurant.isActive || restaurant.isBanned) {
      return next(new AppError('Restaurant is currently unavailable.', 400));
    }

    // Validate order type
    if (orderType === 'delivery' && !restaurant.features.acceptsDelivery) {
      return next(new AppError('This restaurant does not offer delivery.', 400));
    }
    if (orderType === 'pickup' && !restaurant.features.acceptsPickup) {
      return next(new AppError('This restaurant does not offer pickup.', 400));
    }
    if (orderType === 'dine_in' && !restaurant.features.acceptsDineIn) {
      return next(new AppError('This restaurant does not offer dine-in.', 400));
    }

    // Validate delivery address
    if (orderType === 'delivery' && !deliveryAddress) {
      return next(new AppError('Delivery address is required for delivery orders.', 400));
    }

    // Validate minimum order
    if (cart.subtotal < restaurant.minOrderAmount) {
      return next(new AppError(`Minimum order amount is ₹${restaurant.minOrderAmount}.`, 400));
    }

    // Validate schedule if scheduled order
    let scheduleData = { isScheduled: false };
    if (schedule?.scheduledAt) {
      const scheduledDate = new Date(schedule.scheduledAt);

      if (scheduledDate < new Date(Date.now() + 30 * 60 * 1000)) {
        return next(new AppError('Scheduled time must be at least 30 minutes from now.', 400));
      }

      // Validate kitchen capacity
      const { canAccept, reason } = await restaurant.canAcceptOrderAt(scheduledDate);
      if (!canAccept) {
        return next(new AppError(reason, 400));
      }

      scheduleData = {
        isScheduled: true,
        scheduledAt: scheduledDate,
        timeSlot: schedule.timeSlot,
      };
    } else {
      // Immediate order - validate restaurant is currently open
      const openCheck = restaurant.isOpenAt(new Date());
      if (!openCheck.isOpen) {
        return next(new AppError(`Restaurant is currently closed. [DEBUG: ${openCheck.debug}]`, 400));
      }
    }

    // Verify all items are still available
    for (const item of cart.items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem || !menuItem.isActive || !menuItem.isAvailable) {
        return next(new AppError(`"${item.name}" is no longer available.`, 400));
      }
    }

    // Calculate estimated prep time
    let estimatedPrepTime = 0;
    for (const item of cart.items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (menuItem) {
        estimatedPrepTime = Math.max(estimatedPrepTime, menuItem.preparationTime * item.quantity);
      }
    }
    estimatedPrepTime = Math.min(estimatedPrepTime, 90); // Cap at 90 mins

    // Calculate delivery fee for delivery orders
    let deliveryFee = 0;
    if (orderType === 'delivery') {
      deliveryFee = restaurant.deliveryFee || 0;
    }

    // Create order
    const order = await Order.create({
      user: req.user._id,
      restaurant: restaurant._id,
      items: cart.items.map((item) => {
        const orderItem = {
          menuItem: item.menuItem,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          itemTotal: item.itemTotal,
        };
        if (item.variant && item.variant.name) {
          orderItem.variant = {
            name: item.variant.name,
            price: item.variant.price
          };
        }
        if (item.addons && item.addons.length > 0) orderItem.addons = item.addons;
        return orderItem;
      }),
      orderType,
      schedule: scheduleData,
      deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
      pricing: {
        subtotal: cart.subtotal,
        tax: cart.tax,
        deliveryFee,
        packagingCharge: cart.packagingCharge,
        convenienceFee: cart.convenienceFee,
        couponDiscount: cart.couponDiscount,
        total: cart.subtotal + cart.tax + deliveryFee + cart.packagingCharge + cart.convenienceFee - cart.couponDiscount,
      },
      coupon: cart.coupon,
      couponCode: cart.couponCode,
      specialInstructions,
      estimatedPrepTime,
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
    });

    // Generate QR code for pickup
    if (orderType === 'pickup' || orderType === 'dine_in') {
      const qrData = {
        orderId: order._id,
        orderNumber: order.orderNumber,
        type: orderType,
      };
      order.qrCode = await generateQRCode(qrData);
      await order.save();
    }

    // Generate OTP for delivery
    if (orderType === 'delivery') {
      const otp = order.generateOTP();
      await order.save();
      // OTP will be sent to customer when delivery is near
    }

    // Update coupon usage
    if (cart.coupon) {
      await Coupon.findByIdAndUpdate(cart.coupon, {
        $inc: { usedCount: 1 },
        $push: {
          usedBy: {
            user: req.user._id,
            order: order._id,
            usedAt: new Date(),
          },
        },
      });
    }

    // Update menu item order counts
    for (const item of cart.items) {
      await MenuItem.findByIdAndUpdate(item.menuItem, {
        $inc: { totalOrders: item.quantity },
      });
    }

    // Calculate loyalty points (1 point per ₹10 spent)
    const loyaltyPoints = Math.floor(order.pricing.total / 10);
    order.loyaltyPointsEarned = loyaltyPoints;
    await order.save();

    // Clear cart
    cart.items = [];
    cart.restaurant = undefined;
    cart.coupon = undefined;
    cart.couponCode = undefined;
    cart.couponDiscount = 0;
    cart.subtotal = 0;
    cart.tax = 0;
    cart.deliveryFee = 0;
    cart.total = 0;
    await cart.save();

    // Update restaurant stats
    await Restaurant.findByIdAndUpdate(restaurant._id, {
      $inc: { totalOrders: 1 },
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: {
        order,
        paymentRequired: true,
        orderId: order._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get User Orders ────────────────────────────────────
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.status = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('restaurant', 'name slug logo')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Order by ID ────────────────────────────────────
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name slug logo phone address')
      .populate('user', 'name email phone')
      .populate('deliveryAddress')
      .populate('delivery')
      .populate('payment');

    if (!order) {
      return next(new AppError('Order not found.', 404));
    }

    // Ensure user can only see their own orders (unless restaurant owner/admin)
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'super_admin'
    ) {
      // Check if restaurant owner
      const restaurant = await Restaurant.findOne({ _id: order.restaurant._id, owner: req.user._id });
      if (!restaurant) {
        return next(new AppError('Not authorized to view this order.', 403));
      }
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Restaurant: Get Orders ─────────────────────────────
exports.getRestaurantOrders = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return next(new AppError('Restaurant not found.', 404));
    }

    const { page = 1, limit = 20, status, date } = req.query;
    const query = { restaurant: restaurant._id };

    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Order Status (Restaurant) ───────────────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!order) {
      return next(new AppError('Order not found.', 404));
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready_for_pickup', 'cancelled'],
      ready_for_pickup: ['out_for_delivery', 'delivered'],
      out_for_delivery: ['delivered'],
      delivered: [],
      cancelled: ['refunded'],
      refunded: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return next(new AppError(`Cannot transition from '${order.status}' to '${status}'.`, 400));
    }

    // Update status
    order.addStatusHistory(status, req.user._id, note);

    // Handle specific status changes
    switch (status) {
      case 'confirmed':
        // Add to kitchen queue
        await KitchenQueue.create({
          order: order._id,
          restaurant: order.restaurant,
          items: order.items.map((item) => ({
            menuItem: item.menuItem,
            name: item.name,
            quantity: item.quantity,
            variant: item.variant?.name,
            addons: item.addons?.map((a) => a.name),
            specialInstructions: item.specialInstructions,
          })),
          estimatedCompletionTime: order.estimatedPrepTime,
        });
        await NotificationService.onOrderConfirmed(order, order.user);
        break;

      case 'preparing':
        order.prepStartedAt = new Date();
        await KitchenQueue.findOneAndUpdate(
          { order: order._id },
          { status: 'in_progress', startedAt: new Date() }
        );
        await NotificationService.onOrderPreparing(order, order.user);
        break;

      case 'ready_for_pickup':
        order.readyAt = new Date();
        if (order.prepStartedAt) {
          order.actualPrepTime = Math.round((order.readyAt - order.prepStartedAt) / 60000);
        }
        await KitchenQueue.findOneAndUpdate(
          { order: order._id },
          { status: 'completed', completedAt: new Date() }
        );
        await NotificationService.onOrderReady(order, order.user);
        break;

      case 'delivered':
        order.deliveredAt = new Date();
        // Award loyalty points
        if (order.loyaltyPointsEarned > 0) {
          const User = require('../models/User.model');
          await User.findByIdAndUpdate(order.user._id, {
            $inc: { loyaltyPoints: order.loyaltyPointsEarned },
          });
        }
        // Update restaurant revenue
        await Restaurant.findByIdAndUpdate(order.restaurant, {
          $inc: { totalRevenue: order.pricing.total },
        });
        await NotificationService.onOrderDelivered(order, order.user);
        break;

      case 'cancelled':
        order.cancelledAt = new Date();
        order.cancellationReason = note || 'Cancelled by restaurant';
        order.cancelledBy = req.user._id;
        await KitchenQueue.findOneAndUpdate(
          { order: order._id },
          { status: 'cancelled' }
        );
        await NotificationService.onOrderCancelled(order, order.user);
        break;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Cancel Order (Customer) ────────────────────────────
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return next(new AppError('Order not found.', 404));
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return next(new AppError('Order can only be cancelled before preparation begins.', 400));
    }

    order.addStatusHistory('cancelled', req.user._id, req.body.reason);
    order.cancelledAt = new Date();
    order.cancellationReason = req.body.reason || 'Cancelled by customer';
    order.cancelledBy = req.user._id;
    await order.save();

    await KitchenQueue.findOneAndUpdate(
      { order: order._id },
      { status: 'cancelled' }
    );

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Order Invoice ──────────────────────────────────
exports.getOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant')
      .populate('user', 'name email phone');

    if (!order) {
      return next(new AppError('Order not found.', 404));
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
      return next(new AppError('Not authorized.', 403));
    }

    const { filePath, fileName } = await generateInvoice(order, order.restaurant, order.user);

    res.download(filePath, fileName);
  } catch (error) {
    next(error);
  }
};

// ─── Reorder ────────────────────────────────────────────
exports.reorder = async (req, res, next) => {
  try {
    const previousOrder = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!previousOrder) {
      return next(new AppError('Order not found.', 404));
    }

    // Clear existing cart and add previous order items
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id });
    }

    cart.items = [];
    cart.restaurant = previousOrder.restaurant;

    for (const item of previousOrder.items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (menuItem && menuItem.isActive && menuItem.isAvailable) {
        cart.items.push({
          menuItem: item.menuItem,
          name: item.name,
          price: menuItem.discountPrice || menuItem.price,
          quantity: item.quantity,
          variant: item.variant,
          addons: item.addons,
        });
      }
    }

    await cart.calculateTotals();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Items added to cart. Some unavailable items may have been skipped.',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};
