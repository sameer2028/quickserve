const router = require('express').Router();
const paymentController = require('../controllers/payment.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);

router.post('/create-intent', paymentController.createPaymentIntent);
router.post('/confirm', paymentController.confirmPayment);
router.get('/history', paymentController.getPaymentHistory);
router.post('/refund', authorize('restaurant_owner', 'super_admin'), paymentController.refundPayment);

// Stripe webhook (no auth - verified by signature)
router.post('/webhook', paymentController.stripeWebhook);

module.exports = router;
