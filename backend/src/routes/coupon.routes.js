const router = require('express').Router();
const couponController = require('../controllers/coupon.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/available', couponController.getAvailableCoupons);
router.post('/validate', protect, couponController.validateCoupon);
router.post('/restaurant', protect, authorize('restaurant_owner'), couponController.createRestaurantCoupon);
router.get('/restaurant/my-coupons', protect, authorize('restaurant_owner'), couponController.getMyRestaurantCoupons);

module.exports = router;
