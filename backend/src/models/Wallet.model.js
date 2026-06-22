const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    transactions: [
      {
        type: {
          type: String,
          enum: ['credit', 'debit', 'refund', 'referral', 'loyalty', 'cashback'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: String,
        reference: {
          model: {
            type: String,
            enum: ['Order', 'Payment', 'User'],
          },
          id: mongoose.Schema.Types.ObjectId,
        },
        balanceAfter: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

walletSchema.index({ user: 1 });

// ─── Methods ─────────────────────────────────────────────
walletSchema.methods.credit = function (amount, description, reference) {
  this.balance += amount;
  this.transactions.push({
    type: 'credit',
    amount,
    description,
    reference,
    balanceAfter: this.balance,
  });
  return this;
};

walletSchema.methods.debit = function (amount, description, reference) {
  if (this.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  this.balance -= amount;
  this.transactions.push({
    type: 'debit',
    amount,
    description,
    reference,
    balanceAfter: this.balance,
  });
  return this;
};

walletSchema.methods.refund = function (amount, description, reference) {
  this.balance += amount;
  this.transactions.push({
    type: 'refund',
    amount,
    description,
    reference,
    balanceAfter: this.balance,
  });
  return this;
};

module.exports = mongoose.model('Wallet', walletSchema);
