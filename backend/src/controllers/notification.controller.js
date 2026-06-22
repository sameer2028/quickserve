const NotificationService = require('../services/notification.service');
const { AppError } = require('../middlewares/error.middleware');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await NotificationService.getUserNotifications(req.user._id, { page: parseInt(page), limit: parseInt(limit) });
    res.status(200).json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.user._id);
    if (!notification) return next(new AppError('Notification not found.', 404));
    res.status(200).json({ success: true, data: { notification } });
  } catch (error) { next(error); }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await NotificationService.markAllAsRead(req.user._id);
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) { next(error); }
};

exports.subscribePush = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    req.user.pushSubscription = subscription;
    await req.user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: 'Push notifications enabled.' });
  } catch (error) { next(error); }
};
