const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ─── Email Templates ─────────────────────────────────────
const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to QuickServe! 🎉',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #eee; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to QuickServe!</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">Your food, your schedule</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
          <p>We're thrilled to have you on board! With QuickServe, you can pre-order your meals and skip the wait.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Start Ordering</a>
          </div>
          <p style="color: #aaa; font-size: 13px;">— The QuickServe Team</p>
        </div>
      </div>
    `,
  }),

  emailVerification: (name, verificationUrl) => ({
    subject: 'Verify Your Email - QuickServe',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #eee; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Verify Your Email</h1>
        </div>
        <div style="padding: 30px;">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verify Email</a>
          </div>
          <p style="color: #aaa; font-size: 13px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        </div>
      </div>
    `,
  }),

  passwordReset: (name, resetUrl) => ({
    subject: 'Password Reset - QuickServe',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #eee; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Reset Password</h1>
        </div>
        <div style="padding: 30px;">
          <p>Hi <strong>${name}</strong>,</p>
          <p>You requested a password reset. Click the button below to set a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #aaa; font-size: 13px;">This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  }),

  orderConfirmation: (name, order) => ({
    subject: `Order Confirmed - #${order.orderNumber}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #eee; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Confirmed! ✅</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">#${order.orderNumber}</p>
        </div>
        <div style="padding: 30px;">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your order has been confirmed and is being prepared.</p>
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order Type:</strong> ${order.orderType}</p>
            <p style="margin: 5px 0;"><strong>Items:</strong> ${order.items?.length || 0} items</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> ₹${order.pricing?.total}</p>
            ${order.estimatedPrepTime ? `<p style="margin: 5px 0;"><strong>Est. Prep Time:</strong> ${order.estimatedPrepTime} mins</p>` : ''}
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.CLIENT_URL}/orders/${order._id}" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Track Order</a>
          </div>
        </div>
      </div>
    `,
  }),

  orderStatusUpdate: (name, order, status) => ({
    subject: `Order Update - #${order.orderNumber}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #eee; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Update</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">#${order.orderNumber}</p>
        </div>
        <div style="padding: 30px;">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your order status has been updated to: <strong style="color: #667eea;">${status.replace(/_/g, ' ').toUpperCase()}</strong></p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.CLIENT_URL}/orders/${order._id}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">View Order</a>
          </div>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
