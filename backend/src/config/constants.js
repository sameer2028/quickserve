// ─── User Roles ───────────────────────────────────────────
const ROLES = {
  CUSTOMER: 'customer',
  RESTAURANT_OWNER: 'restaurant_owner',
  RESTAURANT_STAFF: 'restaurant_staff',
  DELIVERY_AGENT: 'delivery_agent',
  SUPER_ADMIN: 'super_admin',
};

// ─── Staff Roles ──────────────────────────────────────────
const STAFF_ROLES = {
  CHEF: 'chef',
  CASHIER: 'cashier',
  MANAGER: 'manager',
  DELIVERY_STAFF: 'delivery_staff',
};

// ─── Order Statuses ───────────────────────────────────────
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// ─── Order Types ──────────────────────────────────────────
const ORDER_TYPES = {
  PICKUP: 'pickup',
  DINE_IN: 'dine_in',
  DELIVERY: 'delivery',
};

// ─── Payment Statuses ─────────────────────────────────────
const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// ─── Payment Methods ──────────────────────────────────────
const PAYMENT_METHODS = {
  CARD: 'card',
  UPI: 'upi',
  NET_BANKING: 'net_banking',
  WALLET: 'wallet',
  CASH: 'cash',
};

// ─── Delivery Statuses ───────────────────────────────────
const DELIVERY_STATUS = {
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  FAILED: 'failed',
};

// ─── Notification Types ──────────────────────────────────
const NOTIFICATION_TYPES = {
  SIGNUP: 'signup',
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_PREPARING: 'order_preparing',
  ORDER_READY: 'order_ready',
  ORDER_DELIVERED: 'order_delivered',
  PAYMENT_SUCCESS: 'payment_success',
  OFFER: 'offer',
  GENERAL: 'general',
};

// ─── Coupon Types ────────────────────────────────────────
const COUPON_TYPES = {
  PERCENTAGE: 'percentage',
  FLAT: 'flat',
  FIRST_ORDER: 'first_order',
  FESTIVAL: 'festival',
};

// ─── Kitchen Priority ───────────────────────────────────
const KITCHEN_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

// ─── Wallet Transaction Types ───────────────────────────
const WALLET_TRANSACTION_TYPES = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  REFUND: 'refund',
  REFERRAL: 'referral',
  LOYALTY: 'loyalty',
};

// ─── Food Categories ────────────────────────────────────
const FOOD_TYPE = {
  VEG: 'veg',
  NON_VEG: 'non_veg',
  VEGAN: 'vegan',
  EGG: 'egg',
};

module.exports = {
  ROLES,
  STAFF_ROLES,
  ORDER_STATUS,
  ORDER_TYPES,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  DELIVERY_STATUS,
  NOTIFICATION_TYPES,
  COUPON_TYPES,
  KITCHEN_PRIORITY,
  WALLET_TRANSACTION_TYPES,
  FOOD_TYPE,
};
