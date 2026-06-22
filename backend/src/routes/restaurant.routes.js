const router = require('express').Router();
const restaurantController = require('../controllers/restaurant.controller');
const { protect, authorize, optionalAuth } = require('../middlewares/auth.middleware');
const { createRestaurantValidator } = require('../validators');
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/', limits: { fileSize: 5 * 1024 * 1024 } });

// Public
router.get('/', optionalAuth, restaurantController.getRestaurants);
router.get('/slug/:slug', restaurantController.getRestaurantBySlug);
router.get('/:id', restaurantController.getRestaurantById);
router.get('/:id/time-slots', restaurantController.getAvailableTimeSlots);
router.get('/:restaurantId/branches', restaurantController.getBranches);

// Restaurant Owner
router.post('/', protect, authorize('customer', 'restaurant_owner'), createRestaurantValidator, restaurantController.createRestaurant);
router.get('/owner/my-restaurant', protect, authorize('restaurant_owner'), restaurantController.getMyRestaurant);
router.put('/:id', protect, authorize('restaurant_owner'), restaurantController.updateRestaurant);
router.post('/:id/images', protect, authorize('restaurant_owner'), upload.array('images', 10), restaurantController.uploadImages);
router.post('/:restaurantId/branches', protect, authorize('restaurant_owner'), restaurantController.createBranch);

module.exports = router;
