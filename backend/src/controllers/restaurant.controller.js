const Restaurant = require('../models/Restaurant.model');
const Branch = require('../models/Branch.model');
const RestaurantApplication = require('../models/RestaurantApplication.model');
const { AppError } = require('../middlewares/error.middleware');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

// ─── Create Restaurant ───────────────────────────────────
exports.createRestaurant = async (req, res, next) => {
  try {
    const existing = await Restaurant.findOne({ owner: req.user._id });
    if (existing) {
      return next(new AppError('You already have a restaurant registered.', 400));
    }

    const restaurant = await Restaurant.create({
      ...req.body,
      owner: req.user._id,
    });

    // Update user role to restaurant_owner if customer
    if (req.user.role === 'customer') {
      req.user.role = 'restaurant_owner';
      await req.user.save({ validateBeforeSave: false });
    }

    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully. Pending verification.',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get All Restaurants (Public) ────────────────────────
exports.getRestaurants = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, search, cuisine, foodType,
      sortBy = 'rating', minRating, maxCost, lat, lng,
      radius = 10, offers,
    } = req.query;

    const query = { isActive: true, isBanned: false };

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Cuisine filter
    if (cuisine) {
      query.cuisine = { $in: cuisine.split(',') };
    }

    // Food type filter
    if (foodType) {
      query.foodType = foodType === 'veg' ? 'veg' : { $in: ['non_veg', 'both'] };
    }

    // Rating filter
    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }

    // Cost filter
    if (maxCost) {
      query.avgCostForTwo = { $lte: parseInt(maxCost) };
    }

    // Sort options
    let sort = {};
    switch (sortBy) {
      case 'rating':
        sort = { 'rating.average': -1 };
        break;
      case 'cost_low':
        sort = { avgCostForTwo: 1 };
        break;
      case 'cost_high':
        sort = { avgCostForTwo: -1 };
        break;
      case 'popular':
        sort = { totalOrders: -1 };
        break;
      default:
        sort = { 'rating.average': -1 };
    }

    // Geolocation-based nearby search
    let restaurants;
    let total;

    if (lat && lng) {
      const geoQuery = {
        ...query,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            $maxDistance: parseInt(radius) * 1000, // km to meters
          },
        },
      };

      total = await Restaurant.countDocuments(geoQuery);
      restaurants = await Restaurant.find(geoQuery)
        .select('-bankDetails -stripeAccountId -inventory')
        .sort(sort)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
    } else {
      total = await Restaurant.countDocuments(query);
      restaurants = await Restaurant.find(query)
        .select('-bankDetails -stripeAccountId -inventory')
        .sort(sort)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));
    }

    res.status(200).json({
      success: true,
      data: {
        restaurants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Restaurant by Slug ──────────────────────────────
exports.getRestaurantBySlug = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate('menuCategories');

    if (!restaurant) {
      return next(new AppError('Restaurant not found.', 404));
    }

    res.status(200).json({
      success: true,
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Restaurant by ID ───────────────────────────────
exports.getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return next(new AppError('Restaurant not found.', 404));
    }

    res.status(200).json({
      success: true,
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Restaurant ──────────────────────────────────
exports.updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or unauthorized.', 404));
    }

    const allowedFields = [
      'name', 'description', 'cuisine', 'phone', 'email',
      'address', 'location', 'operatingHours', 'foodType',
      'avgCostForTwo', 'features', 'kitchenCapacity', 'deliveryRadius',
      'deliveryFee', 'minOrderAmount', 'taxRate', 'convenienceFee',
      'packagingCharge', 'gstNumber', 'fssaiLicense', 'bankDetails',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        restaurant[field] = req.body[field];
      }
    });

    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully.',
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Upload Restaurant Images ────────────────────────────
exports.uploadImages = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or unauthorized.', 404));
    }

    if (!req.files || req.files.length === 0) {
      return next(new AppError('Please upload at least one image.', 400));
    }

    const uploadedImages = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path, 'quickserve/restaurants');
      uploadedImages.push(result);
    }

    restaurant.images.push(...uploadedImages);
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully.',
      data: { images: restaurant.images },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get My Restaurant ──────────────────────────────────
exports.getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id })
      .populate('menuCategories');

    if (!restaurant) {
      return next(new AppError('You do not have a restaurant registered.', 404));
    }

    res.status(200).json({
      success: true,
      data: { restaurant },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Get Restaurant Available Time Slots ─────────────────
exports.getAvailableTimeSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return next(new AppError('Restaurant not found.', 404));
    }

    const requestedDate = new Date(date || Date.now());
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[requestedDate.getDay()];
    const hours = restaurant.operatingHours.find((h) => h.day === dayName);

    if (!hours || hours.isClosed) {
      return res.status(200).json({
        success: true,
        data: { slots: [], message: 'Restaurant is closed on this day.' },
      });
    }

    // Generate time slots
    const Order = require('../models/Order.model');
    const slotDuration = restaurant.kitchenCapacity.slotDurationMinutes;
    const maxOrders = restaurant.kitchenCapacity.maxOrdersPerSlot;
    const slots = [];

    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);

    let currentSlot = new Date(requestedDate);
    currentSlot.setHours(openHour, openMin, 0, 0);

    const closingTime = new Date(requestedDate);
    closingTime.setHours(closeHour, closeMin, 0, 0);

    while (currentSlot < closingTime) {
      const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);

      // Count existing orders in this slot
      const orderCount = await Order.countDocuments({
        restaurant: restaurant._id,
        'schedule.scheduledAt': { $gte: currentSlot, $lt: slotEnd },
        status: { $nin: ['cancelled', 'refunded'] },
      });

      slots.push({
        start: currentSlot.toISOString(),
        end: slotEnd.toISOString(),
        startTime: `${String(currentSlot.getHours()).padStart(2, '0')}:${String(currentSlot.getMinutes()).padStart(2, '0')}`,
        endTime: `${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`,
        available: maxOrders - orderCount,
        maxCapacity: maxOrders,
        isAvailable: orderCount < maxOrders,
      });

      currentSlot = slotEnd;
    }

    res.status(200).json({
      success: true,
      data: { slots, date: requestedDate.toDateString() },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Branch CRUD ─────────────────────────────────────────
exports.createBranch = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.restaurantId,
      owner: req.user._id,
    });

    if (!restaurant) {
      return next(new AppError('Restaurant not found or unauthorized.', 404));
    }

    const branch = await Branch.create({
      ...req.body,
      restaurant: restaurant._id,
    });

    res.status(201).json({
      success: true,
      message: 'Branch created successfully.',
      data: { branch },
    });
  } catch (error) {
    next(error);
  }
};

exports.getBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find({ restaurant: req.params.restaurantId, isActive: true });

    res.status(200).json({
      success: true,
      data: { branches },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Apply Restaurant ─────────────────────────────────────
exports.applyRestaurant = async (req, res, next) => {
  try {
    const { restaurantName, ownerName, email, phone, city, cuisine } = req.body;

    if (!restaurantName || !ownerName || !email || !phone || !city) {
      return next(new AppError('Please provide all required fields (Restaurant Name, Owner Name, Email, Phone, City).', 400));
    }

    const application = await RestaurantApplication.create({
      restaurantName,
      ownerName,
      email,
      phone,
      city,
      cuisine,
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. We will contact you shortly.',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};
