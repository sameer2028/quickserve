const Cart = require('../models/Cart.model');
const MenuItem = require('../models/MenuItem.model');
const Coupon = require('../models/Coupon.model');
const { AppError } = require('../middlewares/error.middleware');

// ─── Get Cart ────────────────────────────────────────────
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('restaurant', 'name slug logo deliveryFee minOrderAmount taxRate')
      .populate('items.menuItem', 'name price images foodType isAvailable');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.status(200).json({
      success: true,
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Add Item to Cart ────────────────────────────────────
exports.addItem = async (req, res, next) => {
  try {
    const { menuItemId, quantity = 1, variant, addons, specialInstructions } = req.body;

    const menuItem = await MenuItem.findById(menuItemId).populate('restaurant');
    if (!menuItem || !menuItem.isActive || !menuItem.isAvailable) {
      return next(new AppError('Menu item is not available.', 400));
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if cart has items from a different restaurant
    if (cart.restaurant && cart.restaurant.toString() !== menuItem.restaurant._id.toString() && cart.items.length > 0) {
      return next(new AppError('Your cart contains items from a different restaurant. Clear your cart first.', 400));
    }

    cart.restaurant = menuItem.restaurant._id;

    // Determine price
    let price = menuItem.discountPrice && menuItem.discountPrice < menuItem.price
      ? menuItem.discountPrice : menuItem.price;

    // Check if same item with same variant already exists
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.menuItem.toString() === menuItemId &&
        JSON.stringify(item.variant) === JSON.stringify(variant)
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
      if (cart.items[existingIndex].quantity > 20) {
        cart.items[existingIndex].quantity = 20;
      }
    } else {
      cart.items.push({
        menuItem: menuItemId,
        name: menuItem.name,
        price,
        quantity,
        variant: variant || null,
        addons: addons || [],
        specialInstructions: specialInstructions || '',
      });
    }

    await cart.calculateTotals();
    await cart.save();

    await cart.populate('restaurant', 'name slug logo deliveryFee');
    await cart.populate('items.menuItem', 'name price images foodType');

    res.status(200).json({
      success: true,
      message: 'Item added to cart.',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update Item Quantity ────────────────────────────────
exports.updateItemQuantity = async (req, res, next) => {
  try {
    const { itemIndex, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found.', 404));
    }

    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      return next(new AppError('Invalid item index.', 400));
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = Math.min(quantity, 20);
    }

    // Clear restaurant if cart is empty
    if (cart.items.length === 0) {
      cart.restaurant = undefined;
      cart.coupon = undefined;
      cart.couponCode = undefined;
      cart.couponDiscount = 0;
    }

    await cart.calculateTotals();
    await cart.save();

    res.status(200).json({
      success: true,
      message: quantity <= 0 ? 'Item removed from cart.' : 'Quantity updated.',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Remove Item from Cart ───────────────────────────────
exports.removeItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found.', 404));
    }

    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    if (cart.items.length === 0) {
      cart.restaurant = undefined;
      cart.coupon = undefined;
      cart.couponCode = undefined;
      cart.couponDiscount = 0;
    }

    await cart.calculateTotals();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart.',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Clear Cart ──────────────────────────────────────────
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.restaurant = undefined;
      cart.coupon = undefined;
      cart.couponCode = undefined;
      cart.couponDiscount = 0;
      cart.subtotal = 0;
      cart.tax = 0;
      cart.deliveryFee = 0;
      cart.packagingCharge = 0;
      cart.convenienceFee = 0;
      cart.total = 0;
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cart cleared.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Apply Coupon ────────────────────────────────────────
exports.applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return next(new AppError('Cart is empty.', 400));
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return next(new AppError('Invalid coupon code.', 404));
    }

    // Validate coupon
    const { valid, reason } = coupon.isValid();
    if (!valid) {
      return next(new AppError(reason, 400));
    }

    // Check per-user limit
    const { canUse, reason: userReason } = coupon.canBeUsedByUser(req.user._id);
    if (!canUse) {
      return next(new AppError(userReason, 400));
    }

    // Check if first order coupon
    if (coupon.type === 'first_order') {
      const Order = require('../models/Order.model');
      const orderCount = await Order.countDocuments({
        user: req.user._id,
        status: { $nin: ['cancelled', 'refunded'] },
      });
      if (orderCount > 0) {
        return next(new AppError('This coupon is only valid for your first order.', 400));
      }
    }

    // Check restaurant applicability
    if (coupon.applicableTo === 'specific_restaurants') {
      if (!coupon.applicableRestaurants.includes(cart.restaurant.toString())) {
        return next(new AppError('This coupon is not valid for this restaurant.', 400));
      }
    }

    // Calculate discount
    const { discount, reason: discountReason } = coupon.calculateDiscount(cart.subtotal);
    if (discount === 0 && discountReason) {
      return next(new AppError(discountReason, 400));
    }

    cart.coupon = coupon._id;
    cart.couponCode = coupon.code;
    cart.couponDiscount = discount;

    await cart.calculateTotals();
    await cart.save();

    res.status(200).json({
      success: true,
      message: `Coupon applied! You saved ₹${discount}.`,
      data: { cart, discount },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Remove Coupon ───────────────────────────────────────
exports.removeCoupon = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found.', 404));
    }

    cart.coupon = undefined;
    cart.couponCode = undefined;
    cart.couponDiscount = 0;

    await cart.calculateTotals();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Coupon removed.',
      data: { cart },
    });
  } catch (error) {
    next(error);
  }
};
