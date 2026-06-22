const router = require('express').Router();
const cartController = require('../controllers/cart.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/', cartController.getCart);
router.post('/add', cartController.addItem);
router.put('/update-quantity', cartController.updateItemQuantity);
router.delete('/item/:itemId', cartController.removeItem);
router.delete('/clear', cartController.clearCart);
router.post('/apply-coupon', cartController.applyCoupon);
router.delete('/remove-coupon', cartController.removeCoupon);

module.exports = router;
