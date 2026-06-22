const KitchenQueue = require('../models/KitchenQueue.model');
const Restaurant = require('../models/Restaurant.model');
const Order = require('../models/Order.model');
const { AppError } = require('../middlewares/error.middleware');

// ─── Get Kitchen Queue ──────────────────────────────────
exports.getKitchenQueue = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return next(new AppError('Restaurant not found.', 404));

    const { status = 'queued,in_progress' } = req.query;
    const statusArray = status.split(',');

    const queue = await KitchenQueue.find({
      restaurant: restaurant._id,
      status: { $in: statusArray },
    })
      .populate('order', 'orderNumber orderType schedule specialInstructions createdAt')
      .populate('assignedChef', 'name')
      .sort({ priority: -1, createdAt: 1 }); // Urgent first, then FIFO

    res.status(200).json({
      success: true,
      data: { queue, totalItems: queue.length },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Queue Item Status ───────────────────────────
exports.updateQueueItemStatus = async (req, res, next) => {
  try {
    const { status, assignedChef } = req.body;

    const queueItem = await KitchenQueue.findById(req.params.id);
    if (!queueItem) return next(new AppError('Queue item not found.', 404));

    queueItem.status = status;
    if (assignedChef) queueItem.assignedChef = assignedChef;

    if (status === 'in_progress' && !queueItem.startedAt) {
      queueItem.startedAt = new Date();
    }

    if (status === 'completed') {
      queueItem.completedAt = new Date();
      if (queueItem.startedAt) {
        queueItem.actualCompletionTime = Math.round(
          (queueItem.completedAt - queueItem.startedAt) / 60000
        );
      }
    }

    await queueItem.save();

    res.status(200).json({
      success: true,
      message: `Queue item status updated to '${status}'.`,
      data: { queueItem },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Item Status (individual item in order) ──────
exports.updateItemStatus = async (req, res, next) => {
  try {
    const { itemIndex, status } = req.body;

    const queueItem = await KitchenQueue.findById(req.params.id);
    if (!queueItem) return next(new AppError('Queue item not found.', 404));

    if (itemIndex < 0 || itemIndex >= queueItem.items.length) {
      return next(new AppError('Invalid item index.', 400));
    }

    queueItem.items[itemIndex].status = status;

    // Check if all items are ready
    const allReady = queueItem.items.every((item) => item.status === 'ready');
    if (allReady) {
      queueItem.status = 'completed';
      queueItem.completedAt = new Date();
    }

    await queueItem.save();

    res.status(200).json({
      success: true,
      data: { queueItem },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Set Priority ───────────────────────────────────────
exports.setPriority = async (req, res, next) => {
  try {
    const { priority } = req.body;

    const queueItem = await KitchenQueue.findByIdAndUpdate(
      req.params.id,
      { priority },
      { new: true }
    );

    if (!queueItem) return next(new AppError('Queue item not found.', 404));

    res.status(200).json({
      success: true,
      message: `Priority set to '${priority}'.`,
      data: { queueItem },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Kitchen Stats ──────────────────────────────────
exports.getKitchenStats = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return next(new AppError('Restaurant not found.', 404));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [queued, inProgress, completed, avgPrepTime] = await Promise.all([
      KitchenQueue.countDocuments({ restaurant: restaurant._id, status: 'queued' }),
      KitchenQueue.countDocuments({ restaurant: restaurant._id, status: 'in_progress' }),
      KitchenQueue.countDocuments({
        restaurant: restaurant._id, status: 'completed',
        completedAt: { $gte: today },
      }),
      KitchenQueue.aggregate([
        {
          $match: {
            restaurant: restaurant._id,
            status: 'completed',
            actualCompletionTime: { $exists: true },
            completedAt: { $gte: today },
          },
        },
        { $group: { _id: null, avgTime: { $avg: '$actualCompletionTime' } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        queued,
        inProgress,
        completedToday: completed,
        avgPrepTimeToday: avgPrepTime[0]?.avgTime ? Math.round(avgPrepTime[0].avgTime) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
