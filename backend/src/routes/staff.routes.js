const router = require('express').Router();
const staffController = require('../controllers/staff.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(authorize('restaurant_owner'));

router.post('/', staffController.createStaff);
router.get('/', staffController.getStaff);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.removeStaff);

module.exports = router;
