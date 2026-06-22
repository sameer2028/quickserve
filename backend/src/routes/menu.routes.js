const router = require('express').Router();
const menuController = require('../controllers/menu.controller');
const { protect, authorize, optionalAuth } = require('../middlewares/auth.middleware');
const { createMenuItemValidator } = require('../validators');
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/', limits: { fileSize: 5 * 1024 * 1024 } });

// Public
router.get('/:restaurantId/categories', menuController.getCategories);
router.get('/:restaurantId/items', menuController.getMenuItems);
router.get('/items/:id', menuController.getMenuItemById);
router.get('/trending', optionalAuth, menuController.getTrendingItems);
router.get('/trending/:restaurantId', menuController.getTrendingItems);
router.get('/recommended', optionalAuth, menuController.getRecommendedItems);

// Restaurant Owner
router.post('/categories', protect, authorize('restaurant_owner'), menuController.createCategory);
router.put('/categories/:id', protect, authorize('restaurant_owner'), menuController.updateCategory);
router.delete('/categories/:id', protect, authorize('restaurant_owner'), menuController.deleteCategory);
router.post('/items', protect, authorize('restaurant_owner'), createMenuItemValidator, menuController.createMenuItem);
router.put('/items/:id', protect, authorize('restaurant_owner'), menuController.updateMenuItem);
router.delete('/items/:id', protect, authorize('restaurant_owner'), menuController.deleteMenuItem);
router.post('/items/:id/images', protect, authorize('restaurant_owner'), upload.array('images', 5), menuController.uploadMenuItemImages);

module.exports = router;
