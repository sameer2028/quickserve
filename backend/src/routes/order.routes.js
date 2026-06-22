const router = require('express').Router();
const orderController = require('../controllers/order.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);

// Customer
router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.post('/:id/cancel', orderController.cancelOrder);
router.get('/:id/invoice', orderController.getOrderInvoice);
router.post('/:id/reorder', orderController.reorder);

// Restaurant Owner
router.get('/restaurant/orders', authorize('restaurant_owner', 'restaurant_staff'), orderController.getRestaurantOrders);
router.put('/:id/status', authorize('restaurant_owner', 'restaurant_staff'), orderController.updateOrderStatus);

module.exports = router;
