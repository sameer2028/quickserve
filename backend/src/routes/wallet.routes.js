const router = require('express').Router();
const walletController = require('../controllers/wallet.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

router.get('/', walletController.getWallet);
router.post('/add-money', walletController.addMoney);
router.post('/apply-referral', walletController.applyReferral);
router.post('/redeem-loyalty', walletController.redeemLoyaltyPoints);

module.exports = router;
