const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

// Import config
const connectDB = require('./src/config/database');
const { configurePassport } = require('./src/config/passport');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const restaurantRoutes = require('./src/routes/restaurant.routes');
const menuRoutes = require('./src/routes/menu.routes');
const cartRoutes = require('./src/routes/cart.routes');
const orderRoutes = require('./src/routes/order.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const couponRoutes = require('./src/routes/coupon.routes');
const reviewRoutes = require('./src/routes/review.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const deliveryRoutes = require('./src/routes/delivery.routes');
const staffRoutes = require('./src/routes/staff.routes');
const kitchenRoutes = require('./src/routes/kitchen.routes');
const adminRoutes = require('./src/routes/admin.routes');
const walletRoutes = require('./src/routes/wallet.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');

// Import error handler
const { errorHandler, notFound } = require('./src/middlewares/error.middleware');

const app = express();

// ─── Security Middleware ──────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());

// ─── General Middleware ───────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    process.env.CLIENT_URL,
    process.env.ADMIN_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   message: { success: false, message: 'Too many requests, please try again later.' },
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use('/api/', limiter);

// Auth rate limit (stricter)
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 20,
//   message: { success: false, message: 'Too many auth attempts, please try again later.' },
// });
// app.use('/api/v1/auth/', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Passport ─────────────────────────────────────────────
app.use(passport.initialize());
configurePassport(passport);

// ─── API Routes ───────────────────────────────────────────
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/restaurants`, restaurantRoutes);
app.use(`${API_PREFIX}/menu`, menuRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/coupons`, couponRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/delivery`, deliveryRoutes);
app.use(`${API_PREFIX}/staff`, staffRoutes);
app.use(`${API_PREFIX}/kitchen`, kitchenRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'QuickServe API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── Error Handling ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 QuickServe API Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Base: http://localhost:${PORT}/api/v1\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
