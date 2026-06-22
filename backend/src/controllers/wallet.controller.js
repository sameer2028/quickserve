const Wallet = require('../models/Wallet.model');
const User = require('../models/User.model');
const { AppError } = require('../middlewares/error.middleware');

// ─── Get Wallet ─────────────────────────────────────────
exports.getWallet = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        balance: wallet.balance,
        transactions: wallet.transactions.slice(-20).reverse(),
      },
    });
  } catch (error) { next(error); }
};

// ─── Add Money to Wallet ────────────────────────────────
exports.addMoney = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return next(new AppError('Invalid amount.', 400));

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) return next(new AppError('Wallet not found.', 404));

    wallet.credit(amount, 'Added money to wallet');
    await wallet.save();

    res.status(200).json({
      success: true,
      message: `₹${amount} added to wallet.`,
      data: { balance: wallet.balance },
    });
  } catch (error) { next(error); }
};

// ─── Apply Referral Code ────────────────────────────────
exports.applyReferral = async (req, res, next) => {
  try {
    const { referralCode } = req.body;

    if (req.user.referredBy) {
      return next(new AppError('You have already used a referral code.', 400));
    }

    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (!referrer) return next(new AppError('Invalid referral code.', 404));
    if (referrer._id.toString() === req.user._id.toString()) {
      return next(new AppError('You cannot use your own referral code.', 400));
    }

    // Credit both users
    const REFERRAL_BONUS = 50;

    let userWallet = await Wallet.findOne({ user: req.user._id });
    if (!userWallet) userWallet = await Wallet.create({ user: req.user._id });
    userWallet.credit(REFERRAL_BONUS, 'Referral bonus', { model: 'User', id: referrer._id });
    await userWallet.save();

    let referrerWallet = await Wallet.findOne({ user: referrer._id });
    if (!referrerWallet) referrerWallet = await Wallet.create({ user: referrer._id });
    referrerWallet.credit(REFERRAL_BONUS, `Referral bonus - ${req.user.name} joined`, { model: 'User', id: req.user._id });
    await referrerWallet.save();

    req.user.referredBy = referrer._id;
    await req.user.save({ validateBeforeSave: false });

    referrer.totalReferrals += 1;
    await referrer.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `Referral applied! ₹${REFERRAL_BONUS} credited to your wallet.`,
    });
  } catch (error) { next(error); }
};

// ─── Redeem Loyalty Points ──────────────────────────────
exports.redeemLoyaltyPoints = async (req, res, next) => {
  try {
    const { points } = req.body;
    const user = await User.findById(req.user._id);

    if (points > user.loyaltyPoints) {
      return next(new AppError('Insufficient loyalty points.', 400));
    }

    if (points < 100) {
      return next(new AppError('Minimum 100 points required for redemption.', 400));
    }

    const amount = points / 10; // 10 points = ₹1

    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) wallet = await Wallet.create({ user: req.user._id });

    wallet.credit(amount, `Redeemed ${points} loyalty points`);
    wallet.transactions[wallet.transactions.length - 1].type = 'loyalty';
    await wallet.save();

    user.loyaltyPoints -= points;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `${points} points redeemed. ₹${amount} credited to wallet.`,
      data: { balance: wallet.balance, remainingPoints: user.loyaltyPoints },
    });
  } catch (error) { next(error); }
};
