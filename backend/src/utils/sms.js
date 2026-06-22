const sendSMS = async ({ to, message }) => {
  try {
    // Only attempt if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID === 'your_twilio_sid') {
      console.log(`📱 SMS (dev mode): To: ${to}, Message: ${message}`);
      return { success: true, dev: true };
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log(`📱 SMS sent: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error(`❌ SMS send failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ─── SMS Templates ───────────────────────────────────────
const smsTemplates = {
  otp: (otp) => `Your QuickServe verification code is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`,
  
  orderConfirmed: (orderNumber) => `Your QuickServe order #${orderNumber} has been confirmed! We'll notify you when it's ready.`,
  
  orderReady: (orderNumber) => `Your QuickServe order #${orderNumber} is ready for pickup! 🎉`,
  
  orderDelivered: (orderNumber) => `Your QuickServe order #${orderNumber} has been delivered. Enjoy your meal! 🍽️`,
  
  deliveryOTP: (otp) => `Your delivery OTP is: ${otp}. Share this with the delivery agent to confirm your order.`,

  welcome: (name) => `Welcome to QuickServe, ${name}! Pre-order your favorite food and skip the wait. 🚀`,
};

module.exports = { sendSMS, smsTemplates };
