const MenuCategory = require('../models/MenuCategory.model');
const MenuItem = require('../models/MenuItem.model');
const Restaurant = require('../models/Restaurant.model');
const { AppError } = require('../middlewares/error.middleware');
const { uploadToCloudinary } = require('../config/cloudinary');

// ═══════════════════════════════════════════════════════════
// CATEGORY CONTROLLERS
// ═══════════════════════════════════════════════════════════

exports.createCategory = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return next(new AppError('Restaurant not found.', 404));
    }

    const category = await MenuCategory.create({
      ...req.body,
      restaurant: restaurant._id,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await MenuCategory.find({
      restaurant: req.params.restaurantId,
      isActive: true,
    })
      .sort({ sortOrder: 1 })
      .populate({
        path: 'items',
        match: { isActive: true, isAvailable: true },
        options: { sort: { sortOrder: 1 } },
      });

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const category = await MenuCategory.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return next(new AppError('Category not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Category updated.',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const category = await MenuCategory.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return next(new AppError('Category not found.', 404));
    }

    // Deactivate all items in this category
    await MenuItem.updateMany({ category: category._id }, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'Category and its items have been deactivated.',
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════
// MENU ITEM CONTROLLERS
// ═══════════════════════════════════════════════════════════

exports.createMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return next(new AppError('Restaurant not found.', 404));
    }

    // Verify category belongs to restaurant
    const category = await MenuCategory.findOne({
      _id: req.body.category,
      restaurant: restaurant._id,
    });

    if (!category) {
      return next(new AppError('Category not found or does not belong to your restaurant.', 404));
    }

    const menuItem = await MenuItem.create({
      ...req.body,
      restaurant: restaurant._id,
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully.',
      data: { menuItem },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMenuItems = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, category, foodType,
      search, minPrice, maxPrice, sortBy = 'sortOrder',
    } = req.query;

    const query = {
      restaurant: req.params.restaurantId,
      isActive: true,
      isAvailable: true,
    };

    if (category) query.category = category;
    if (foodType) query.foodType = foodType;
    if (search) query.$text = { $search: search };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let sort = {};
    switch (sortBy) {
      case 'price_low': sort = { price: 1 }; break;
      case 'price_high': sort = { price: -1 }; break;
      case 'rating': sort = { 'rating.average': -1 }; break;
      case 'popular': sort = { totalOrders: -1 }; break;
      default: sort = { sortOrder: 1 };
    }

    const total = await MenuItem.countDocuments(query);
    const menuItems = await MenuItem.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        menuItems,
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

exports.getMenuItemById = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('category', 'name')
      .populate('restaurant', 'name slug');

    if (!menuItem) {
      return next(new AppError('Menu item not found.', 404));
    }

    res.status(200).json({
      success: true,
      data: { menuItem },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return next(new AppError('Menu item not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Menu item updated.',
      data: { menuItem },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      { isActive: false },
      { new: true }
    );

    if (!menuItem) {
      return next(new AppError('Menu item not found.', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Menu item deactivated.',
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadMenuItemImages = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const menuItem = await MenuItem.findOne({
      _id: req.params.id,
      restaurant: restaurant._id,
    });

    if (!menuItem) {
      return next(new AppError('Menu item not found.', 404));
    }

    if (!req.files || req.files.length === 0) {
      return next(new AppError('Please upload at least one image.', 400));
    }

    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path, 'quickserve/menu');
      menuItem.images.push(result);
    }

    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'Images uploaded.',
      data: { images: menuItem.images },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Trending & Recommended ──────────────────────────────
exports.getTrendingItems = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const query = { isActive: true, isAvailable: true };
    if (restaurantId) query.restaurant = restaurantId;

    const items = await MenuItem.find(query)
      .sort({ totalOrders: -1 })
      .limit(10)
      .populate('restaurant', 'name slug');

    res.status(200).json({
      success: true,
      data: { items },
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecommendedItems = async (req, res, next) => {
  try {
    // AI-like recommendation based on user's order history and popular items
    const Order = require('../models/Order.model');

    let recommendedItems = [];

    if (req.user) {
      // Get user's recent ordered categories and food types
      const recentOrders = await Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('items.menuItem', 'category foodType tags');

      const preferredCategories = new Set();
      const preferredFoodTypes = new Set();
      const orderedItemIds = new Set();

      recentOrders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.menuItem) {
            preferredCategories.add(item.menuItem.category?.toString());
            preferredFoodTypes.add(item.menuItem.foodType);
            orderedItemIds.add(item.menuItem._id.toString());
          }
        });
      });

      // Recommend items from preferred categories that user hasn't ordered
      if (preferredCategories.size > 0) {
        recommendedItems = await MenuItem.find({
          category: { $in: Array.from(preferredCategories) },
          _id: { $nin: Array.from(orderedItemIds) },
          isActive: true,
          isAvailable: true,
        })
          .sort({ 'rating.average': -1, totalOrders: -1 })
          .limit(10)
          .populate('restaurant', 'name slug');
      }
    }

    // If not enough recommendations, fill with popular items
    if (recommendedItems.length < 10) {
      const popularItems = await MenuItem.find({
        isActive: true,
        isAvailable: true,
        _id: { $nin: recommendedItems.map((i) => i._id) },
      })
        .sort({ totalOrders: -1, 'rating.average': -1 })
        .limit(10 - recommendedItems.length)
        .populate('restaurant', 'name slug');

      recommendedItems = [...recommendedItems, ...popularItems];
    }

    res.status(200).json({
      success: true,
      data: { items: recommendedItems },
    });
  } catch (error) {
    next(error);
  }
};
