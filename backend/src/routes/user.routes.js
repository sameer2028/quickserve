const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { createAddressValidator } = require('../validators');
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/', limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/avatar', upload.single('avatar'), userController.updateAvatar);
router.put('/change-password', userController.changePassword);

// Addresses
router.get('/addresses', userController.getAddresses);
router.post('/addresses', createAddressValidator, userController.addAddress);
router.put('/addresses/:addressId', userController.updateAddress);
router.delete('/addresses/:addressId', userController.deleteAddress);

// Favorites
router.get('/favorites', userController.getFavoriteRestaurants);
router.post('/favorites/:restaurantId', userController.toggleFavoriteRestaurant);

module.exports = router;
