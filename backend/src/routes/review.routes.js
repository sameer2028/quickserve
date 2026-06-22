const router = require('express').Router();
const reviewController = require('../controllers/review.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const { createReviewValidator } = require('../validators');
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/', limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);
router.post('/', protect, createReviewValidator, reviewController.createReview);
router.put('/:id', protect, reviewController.updateReview);
router.delete('/:id', protect, reviewController.deleteReview);
router.post('/:id/reply', protect, authorize('restaurant_owner'), reviewController.replyToReview);
router.post('/:id/images', protect, upload.array('images', 5), reviewController.uploadReviewImages);

module.exports = router;
