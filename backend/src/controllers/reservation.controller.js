const Reservation = require('../models/Reservation.model');
const Table = require('../models/Table.model');
const Restaurant = require('../models/Restaurant.model');
const Order = require('../models/Order.model');
const { AppError } = require('../middlewares/error.middleware');
const NotificationService = require('../services/notification.service');

// ─── Table Management ───────────────────────────────────
exports.getTables = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return next(new AppError('Restaurant not found.', 404));

    const tables = await Table.find({ restaurant: restaurant._id }).sort({ tableNumber: 1 });
    res.status(200).json({ success: true, data: { tables } });
  } catch (error) {
    next(error);
  }
};

exports.addTable = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return next(new AppError('Restaurant not found.', 404));

    const table = await Table.create({ ...req.body, restaurant: restaurant._id });
    res.status(201).json({ success: true, message: 'Table added.', data: { table } });
  } catch (error) {
    next(error);
  }
};

exports.removeTable = async (req, res, next) => {
  try {
    const table = await Table.findOneAndDelete({ _id: req.params.id, restaurant: (await Restaurant.findOne({ owner: req.user._id }))._id });
    if (!table) return next(new AppError('Table not found.', 404));

    res.status(200).json({ success: true, message: 'Table removed.' });
  } catch (error) {
    next(error);
  }
};

// ─── Create Reservation ──────────────────────────────────
exports.createReservation = async (req, res, next) => {
  try {
    const { restaurantId, date, timeSlot, guestCount, specialRequests, orderId } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return next(new AppError('Restaurant not found.', 404));
    }

    if (!restaurant.features.acceptsDineIn) {
      return next(new AppError('This restaurant does not offer dine-in or reservations.', 400));
    }

    // Create reservation as 'pending'
    const reservation = await Reservation.create({
      customer: req.user._id,
      restaurant: restaurant._id,
      order: orderId || undefined,
      date,
      timeSlot,
      guestCount,
      specialRequests,
      status: 'pending'
    });

    // Link reservation to order if orderId provided
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.reservation = reservation._id;
        await order.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Reservation request sent. Please wait for confirmation.',
      data: { reservation },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get User Reservations ──────────────────────────────
exports.getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ customer: req.user._id })
      .populate('restaurant', 'name slug coverImage address phone')
      .populate('assignedTable')
      .sort({ date: -1, 'timeSlot.start': -1 });

    res.status(200).json({
      success: true,
      data: { reservations },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Restaurant: Get Reservations ───────────────────────
exports.getRestaurantReservations = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return next(new AppError('Restaurant not found.', 404));
    }

    const { status, date } = req.query;
    const query = { restaurant: restaurant._id };

    if (status) query.status = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const reservations = await Reservation.find(query)
      .populate('customer', 'name email phone')
      .populate('assignedTable')
      .populate('order')
      .sort({ date: 1, 'timeSlot.start': 1 });

    res.status(200).json({
      success: true,
      data: { reservations },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Restaurant: Assign Table & Confirm ─────────────────
exports.assignTable = async (req, res, next) => {
  try {
    const { tableId } = req.body;
    const reservation = await Reservation.findById(req.params.id)
      .populate('restaurant')
      .populate('customer');

    if (!reservation) {
      return next(new AppError('Reservation not found.', 404));
    }

    // Verify ownership
    if (reservation.restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
       return next(new AppError('Not authorized.', 403));
    }

    const table = await Table.findById(tableId);
    if (!table || table.restaurant.toString() !== reservation.restaurant._id.toString()) {
       return next(new AppError('Invalid table selected.', 400));
    }

    reservation.assignedTable = table._id;
    reservation.status = 'confirmed';
    await reservation.save();

    // Mark table as reserved
    table.status = 'reserved';
    await table.save();

    res.status(200).json({
      success: true,
      message: 'Table assigned and reservation confirmed.',
      data: { reservation },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Restaurant: Update Reservation Status ──────────────
exports.updateReservationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findById(req.params.id).populate('restaurant');

    if (!reservation) {
      return next(new AppError('Reservation not found.', 404));
    }

    // Verify ownership
    if (reservation.restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
       return next(new AppError('Not authorized.', 403));
    }

    const oldStatus = reservation.status;
    reservation.status = status;
    await reservation.save();

    // Update table status accordingly
    if (reservation.assignedTable) {
       const table = await Table.findById(reservation.assignedTable);
       if (table) {
          if (status === 'checked_in') {
             table.status = 'occupied';
          } else if (['completed', 'cancelled', 'no_show', 'rejected'].includes(status)) {
             table.status = 'available';
          }
          await table.save();
       }
    }

    res.status(200).json({
      success: true,
      message: `Reservation status updated to ${status}.`,
      data: { reservation },
    });
  } catch (error) {
    next(error);
  }
};
