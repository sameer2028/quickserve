const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('../middlewares/error.middleware');

// ─── Validation Result Handler ───────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return next(new AppError(messages.join('. '), 400));
  }
  next();
};

// ─── Auth Validators ─────────────────────────────────────
const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please provide a valid phone number'),
  validate,
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate,
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  validate,
];

const resetPasswordValidator = [
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  validate,
];

// ─── Restaurant Validators ──────────────────────────────
const createRestaurantValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Restaurant name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('phone')
    .notEmpty().withMessage('Phone number is required'),
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email'),
  body('address.street')
    .notEmpty().withMessage('Street address is required'),
  body('address.city')
    .notEmpty().withMessage('City is required'),
  body('address.state')
    .notEmpty().withMessage('State is required'),
  body('address.pincode')
    .notEmpty().withMessage('Pincode is required'),
  body('location.coordinates')
    .isArray({ min: 2, max: 2 }).withMessage('Location coordinates [longitude, latitude] required'),
  body('avgCostForTwo')
    .isNumeric().withMessage('Average cost for two must be a number')
    .isFloat({ min: 0 }).withMessage('Cost cannot be negative'),
  validate,
];

// ─── Menu Item Validators ───────────────────────────────
const createMenuItemValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Item name is required')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  body('price')
    .isNumeric().withMessage('Price must be a number')
    .isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isMongoId().withMessage('Invalid category ID'),
  body('foodType')
    .notEmpty().withMessage('Food type is required')
    .isIn(['veg', 'non_veg', 'vegan', 'egg']).withMessage('Invalid food type'),
  validate,
];

// ─── Order Validators ───────────────────────────────────
const createOrderValidator = [
  body('restaurant')
    .notEmpty().withMessage('Restaurant ID is required')
    .isMongoId().withMessage('Invalid restaurant ID'),
  body('orderType')
    .notEmpty().withMessage('Order type is required')
    .isIn(['pickup', 'dine_in', 'delivery']).withMessage('Invalid order type'),
  body('items')
    .isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.menuItem')
    .isMongoId().withMessage('Invalid menu item ID'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  validate,
];

// ─── Review Validators ──────────────────────────────────
const createReviewValidator = [
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
  validate,
];

// ─── Coupon Validators ──────────────────────────────────
const createCouponValidator = [
  body('code')
    .trim()
    .notEmpty().withMessage('Coupon code is required')
    .isLength({ min: 3, max: 20 }).withMessage('Code must be 3-20 characters'),
  body('type')
    .isIn(['percentage', 'flat', 'first_order', 'festival']).withMessage('Invalid coupon type'),
  body('discountValue')
    .isNumeric().withMessage('Discount value must be a number')
    .isFloat({ min: 0 }).withMessage('Discount cannot be negative'),
  body('validFrom')
    .isISO8601().withMessage('Valid from must be a valid date'),
  body('validUntil')
    .isISO8601().withMessage('Valid until must be a valid date'),
  validate,
];

// ─── Address Validators ─────────────────────────────────
const createAddressValidator = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required'),
  body('phone')
    .notEmpty().withMessage('Phone number is required'),
  body('addressLine1')
    .trim()
    .notEmpty().withMessage('Address line 1 is required'),
  body('city')
    .trim()
    .notEmpty().withMessage('City is required'),
  body('state')
    .trim()
    .notEmpty().withMessage('State is required'),
  body('pincode')
    .notEmpty().withMessage('Pincode is required'),
  validate,
];

// ─── MongoDB ID Validator ───────────────────────────────
const mongoIdValidator = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  validate,
];

// ─── Pagination Validator ───────────────────────────────
const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  createRestaurantValidator,
  createMenuItemValidator,
  createOrderValidator,
  createReviewValidator,
  createCouponValidator,
  createAddressValidator,
  mongoIdValidator,
  paginationValidator,
};
