const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Apply protect middleware to all routes
router.use(protect);

// ─── Customer Routes ────────────────────────────────────
router.route('/')
  .post(reservationController.createReservation)
  .get(reservationController.getMyReservations);

// ─── Restaurant Owner Routes ────────────────────────────
// The following routes should only be accessible by the restaurant owner/admin
router.use(authorize('restaurant_owner', 'super_admin'));

router.get('/restaurant/all', reservationController.getRestaurantReservations);
router.patch('/:id/assign-table', reservationController.assignTable);
router.patch('/:id/status', reservationController.updateReservationStatus);

router.get('/tables', reservationController.getTables);
router.post('/tables', reservationController.addTable);
router.delete('/tables/:id', reservationController.removeTable);

module.exports = router;
