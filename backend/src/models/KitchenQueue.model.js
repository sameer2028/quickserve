const mongoose = require('mongoose');

const kitchenQueueSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['queued', 'in_progress', 'completed', 'cancelled'],
      default: 'queued',
    },
    assignedChef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
        },
        name: String,
        quantity: Number,
        variant: String,
        addons: [String],
        specialInstructions: String,
        status: {
          type: String,
          enum: ['pending', 'preparing', 'ready'],
          default: 'pending',
        },
      },
    ],
    estimatedCompletionTime: {
      type: Number, // minutes
    },
    actualCompletionTime: {
      type: Number, // minutes
    },
    startedAt: Date,
    completedAt: Date,
    queuePosition: {
      type: Number,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

kitchenQueueSchema.index({ restaurant: 1, status: 1, priority: -1 });
kitchenQueueSchema.index({ order: 1 });
kitchenQueueSchema.index({ assignedChef: 1 });

module.exports = mongoose.model('KitchenQueue', kitchenQueueSchema);
