const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    staffRole: {
      type: String,
      enum: ['chef', 'cashier', 'manager', 'delivery_staff'],
      required: [true, 'Staff role is required'],
    },
    permissions: {
      canManageMenu: { type: Boolean, default: false },
      canManageOrders: { type: Boolean, default: false },
      canManageStaff: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: false },
      canManageDelivery: { type: Boolean, default: false },
      canProcessPayments: { type: Boolean, default: false },
      canPrintReceipts: { type: Boolean, default: false },
    },
    shift: {
      start: String,
      end: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

staffSchema.index({ restaurant: 1, staffRole: 1 });
staffSchema.index({ user: 1 });

// Set default permissions based on role
staffSchema.pre('save', function (next) {
  if (this.isNew) {
    switch (this.staffRole) {
      case 'chef':
        this.permissions = {
          canManageMenu: false,
          canManageOrders: true,
          canManageStaff: false,
          canViewAnalytics: false,
          canManageDelivery: false,
          canProcessPayments: false,
          canPrintReceipts: true,
        };
        break;
      case 'cashier':
        this.permissions = {
          canManageMenu: false,
          canManageOrders: true,
          canManageStaff: false,
          canViewAnalytics: false,
          canManageDelivery: false,
          canProcessPayments: true,
          canPrintReceipts: true,
        };
        break;
      case 'manager':
        this.permissions = {
          canManageMenu: true,
          canManageOrders: true,
          canManageStaff: true,
          canViewAnalytics: true,
          canManageDelivery: true,
          canProcessPayments: true,
          canPrintReceipts: true,
        };
        break;
      case 'delivery_staff':
        this.permissions = {
          canManageMenu: false,
          canManageOrders: false,
          canManageStaff: false,
          canViewAnalytics: false,
          canManageDelivery: true,
          canProcessPayments: false,
          canPrintReceipts: false,
        };
        break;
    }
  }
  next();
});

module.exports = mongoose.model('Staff', staffSchema);
