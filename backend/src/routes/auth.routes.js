const router = require('express').Router();
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { registerValidator, loginValidator, forgotPasswordValidator, resetPasswordValidator } = require('../validators');

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', forgotPasswordValidator, authController.forgotPassword);
router.put('/reset-password/:token', resetPasswordValidator, authController.resetPassword);
router.get('/me', protect, authController.getMe);
router.post('/resend-verification', protect, authController.resendVerification);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }), authController.googleCallback);

module.exports = router;
