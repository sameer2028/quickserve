const webpush = require('web-push');

// Configure VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PUBLIC_KEY !== 'your_vapid_public_key') {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@quickserve.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const sendPushNotification = async (subscription, payload) => {
  try {
    if (!subscription || !process.env.VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY === 'your_vapid_public_key') {
      console.log('🔔 Push (dev mode):', JSON.stringify(payload));
      return { success: true, dev: true };
    }

    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );

    console.log('🔔 Push notification sent');
    return { success: true };
  } catch (error) {
    console.error(`❌ Push notification failed: ${error.message}`);

    // If subscription is expired, we should handle cleanup
    if (error.statusCode === 410) {
      return { success: false, expired: true };
    }

    return { success: false, error: error.message };
  }
};

// ─── Push Notification Payloads ──────────────────────────
const pushPayloads = {
  orderConfirmed: (orderNumber) => ({
    title: 'Order Confirmed! ✅',
    body: `Your order #${orderNumber} has been confirmed and is being prepared.`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `order-${orderNumber}`,
    data: { url: '/orders' },
  }),

  orderReady: (orderNumber) => ({
    title: 'Order Ready! 🎉',
    body: `Your order #${orderNumber} is ready for pickup!`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `order-${orderNumber}`,
    data: { url: '/orders' },
  }),

  orderDelivered: (orderNumber) => ({
    title: 'Order Delivered! 🍽️',
    body: `Your order #${orderNumber} has been delivered. Enjoy your meal!`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `order-${orderNumber}`,
    data: { url: '/orders' },
  }),

  newOffer: (title, description) => ({
    title: `🎁 ${title}`,
    body: description,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'offer',
    data: { url: '/offers' },
  }),
};

module.exports = { sendPushNotification, pushPayloads };
