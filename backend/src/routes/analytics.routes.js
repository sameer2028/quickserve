const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/restaurant', authorize('restaurant_owner'), analyticsController.getRestaurantAnalytics);
router.get('/platform', authorize('super_admin'), analyticsController.getPlatformAnalytics);

module.exports = router;
