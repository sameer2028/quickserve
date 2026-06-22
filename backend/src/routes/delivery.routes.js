const router = require('express').Router();
const deliveryController = require('../controllers/delivery.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);

// Restaurant Owner
router.post('/assign', authorize('restaurant_owner', 'restaurant_staff'), deliveryController.assignDeliveryAgent);
router.get('/available-agents', authorize('restaurant_owner', 'restaurant_staff'), deliveryController.getAvailableAgents);

// Delivery Agent
router.get('/my-deliveries', authorize('delivery_agent'), deliveryController.getMyDeliveries);
router.put('/:id/accept', authorize('delivery_agent'), deliveryController.acceptDelivery);
router.put('/:id/status', authorize('delivery_agent'), deliveryController.updateDeliveryStatus);
router.post('/:id/verify-otp', authorize('delivery_agent'), deliveryController.verifyDeliveryOTP);

module.exports = router;
