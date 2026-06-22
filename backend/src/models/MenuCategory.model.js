const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      public_id: String,
      url: String,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

menuCategorySchema.index({ restaurant: 1, sortOrder: 1 });

menuCategorySchema.virtual('items', {
  ref: 'MenuItem',
  localField: '_id',
  foreignField: 'category',
});

module.exports = mongoose.model('MenuCategory', menuCategorySchema);
