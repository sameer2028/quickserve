const mongoose = require('mongoose');
const slugify = require('slugify');

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    cuisine: [
      {
        type: String,
        trim: true,
      },
    ],
    logo: {
      public_id: String,
      url: String,
    },
    coverImage: {
      public_id: String,
      url: String,
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: 'India' },
      pincode: { type: String, required: true },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    operatingHours: [
      {
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
        open: String, // "09:00"
        close: String, // "22:00"
        isClosed: { type: Boolean, default: false },
      },
    ],
    foodType: {
      type: String,
      enum: ['veg', 'non_veg', 'both'],
      default: 'both',
    },
    avgCostForTwo: {
      type: Number,
      required: [true, 'Average cost for two is required'],
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    features: {
      hasParking: { type: Boolean, default: false },
      hasWifi: { type: Boolean, default: false },
      hasAC: { type: Boolean, default: false },
      acceptsPreOrders: { type: Boolean, default: true },
      acceptsDineIn: { type: Boolean, default: true },
      acceptsDelivery: { type: Boolean, default: true },
      acceptsPickup: { type: Boolean, default: true },
    },
    kitchenCapacity: {
      maxOrdersPerSlot: { type: Number, default: 20 },
      slotDurationMinutes: { type: Number, default: 30 },
      avgPrepTimeMinutes: { type: Number, default: 25 },
    },
    deliveryRadius: {
      type: Number, // in km
      default: 10,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    taxRate: {
      type: Number,
      default: 5, // percentage
    },
    convenienceFee: {
      type: Number,
      default: 0,
    },
    packagingCharge: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedReason: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    gstNumber: String,
    fssaiLicense: String,
    bankDetails: {
      accountHolder: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },
    stripeAccountId: String,
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    inventory: {
      type: Map,
      of: {
        quantity: Number,
        unit: String,
        lowStockThreshold: Number,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────
restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ slug: 1 });
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ 'rating.average': -1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ foodType: 1 });
restaurantSchema.index({ isActive: 1, isBanned: 1 });
restaurantSchema.index({ name: 'text', description: 'text', cuisine: 'text' });

// ─── Pre-save: Generate slug ─────────────────────────────
restaurantSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true }) +
      '-' + this._id.toString().slice(-6);
  }
  next();
});

// ─── Virtuals ────────────────────────────────────────────
restaurantSchema.virtual('branches', {
  ref: 'Branch',
  localField: '_id',
  foreignField: 'restaurant',
});

restaurantSchema.virtual('menuCategories', {
  ref: 'MenuCategory',
  localField: '_id',
  foreignField: 'restaurant',
});

restaurantSchema.virtual('staff', {
  ref: 'Staff',
  localField: '_id',
  foreignField: 'restaurant',
});

// ─── Methods ────────────────────────────────────────────
restaurantSchema.methods.isOpenAt = function (date) {
  // Convert the input date to IST (UTC + 5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayString = dayNames[istDate.getUTCDay()];
  
  const hours = this.operatingHours.find((h) => h.day === dayString);

  if (!hours || hours.isClosed) return false;

  const currentHour = String(istDate.getUTCHours()).padStart(2, '0');
  const currentMinute = String(istDate.getUTCMinutes()).padStart(2, '0');
  
  const currentTime = `${currentHour}:${currentMinute}`;
  
  return currentTime >= hours.open && currentTime <= hours.close;
};

restaurantSchema.methods.canAcceptOrderAt = async function (date, orderCount) {
  if (!this.isOpenAt(date)) return { canAccept: false, reason: 'Restaurant is closed at this time' };

  const slotStart = new Date(date);
  const slotEnd = new Date(date.getTime() + this.kitchenCapacity.slotDurationMinutes * 60000);

  const Order = mongoose.model('Order');
  const existingOrders = await Order.countDocuments({
    restaurant: this._id,
    'schedule.scheduledAt': { $gte: slotStart, $lt: slotEnd },
    status: { $nin: ['cancelled', 'refunded'] },
  });

  if (existingOrders + (orderCount || 1) > this.kitchenCapacity.maxOrdersPerSlot) {
    return { canAccept: false, reason: 'Kitchen capacity reached for this time slot' };
  }

  return { canAccept: true };
};

module.exports = mongoose.model('Restaurant', restaurantSchema);
