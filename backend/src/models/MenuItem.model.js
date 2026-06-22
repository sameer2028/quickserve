const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuCategory',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
    },
    images: [
      {
        public_id: String,
        url: String,
      },
    ],
    foodType: {
      type: String,
      enum: ['veg', 'non_veg', 'vegan', 'egg'],
      required: [true, 'Food type is required'],
    },
    variants: [
      {
        name: { type: String, required: true }, // e.g., "Small", "Medium", "Large"
        price: { type: Number, required: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
    addons: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        isVeg: { type: Boolean, default: true },
        maxQuantity: { type: Number, default: 5 },
      },
    ],
    nutritionalInfo: {
      calories: Number,
      protein: Number,     // grams
      carbs: Number,       // grams
      fat: Number,         // grams
      fiber: Number,       // grams
      allergens: [String], // e.g., ["nuts", "dairy", "gluten"]
    },
    tags: [String], // e.g., ["spicy", "bestseller", "chef-special"]
    preparationTime: {
      type: Number, // minutes
      default: 20,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────
menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });
menuItemSchema.index({ foodType: 1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ 'rating.average': -1 });
menuItemSchema.index({ totalOrders: -1 });
menuItemSchema.index({ isAvailable: 1, isActive: 1 });

// ─── Virtual: Effective Price ─────────────────────────────
menuItemSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice && this.discountPrice < this.price
    ? this.discountPrice
    : this.price;
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
