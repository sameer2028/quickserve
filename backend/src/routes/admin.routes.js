const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(authorize('super_admin'));

// Users
router.get('/users', adminController.getUsers);
router.put('/users/:id/suspend', adminController.suspendUser);
router.put('/users/:id/unsuspend', adminController.unsuspendUser);

// Restaurants
router.get('/restaurants', adminController.getAllRestaurants);
router.put('/restaurants/:id/verify', adminController.verifyRestaurant);
router.put('/restaurants/:id/ban', adminController.banRestaurant);
router.put('/restaurants/:id/unban', adminController.unbanRestaurant);

// Orders
router.get('/orders', adminController.getAllOrders);

// Coupons
router.post('/coupons', adminController.createCoupon);
router.get('/coupons', adminController.getCoupons);
router.put('/coupons/:id', adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);

// System
router.get('/stats', adminController.getSystemStats);
router.get('/complaints', adminController.getComplaints);

module.exports = router;
