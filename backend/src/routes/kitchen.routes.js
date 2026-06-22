const router = require('express').Router();
const kitchenController = require('../controllers/kitchen.controller');
const { protect, authorize, checkStaffPermission } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(authorize('restaurant_owner', 'restaurant_staff'));

router.get('/queue', kitchenController.getKitchenQueue);
router.put('/queue/:id/status', kitchenController.updateQueueItemStatus);
router.put('/queue/:id/item-status', kitchenController.updateItemStatus);
router.put('/queue/:id/priority', kitchenController.setPriority);
router.get('/stats', kitchenController.getKitchenStats);

module.exports = router;
