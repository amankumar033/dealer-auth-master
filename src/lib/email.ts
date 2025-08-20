import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates
const emailTemplates = {
  orderPlaced: (orderData: any) => ({
    subject: `Order Confirmation - ${orderData.order_id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Confirmation</h2>
        <p>Dear ${orderData.customer_name},</p>
        <p>Your order has been successfully placed and is being reviewed by our team.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> ${orderData.order_id}</p>
          <p><strong>Product:</strong> ${orderData.product_name}</p>
          <p><strong>Total Amount:</strong> ₹${orderData.total_amount}</p>
          <p><strong>Status:</strong> Pending Review</p>
        </div>
        
        <p>We will notify you once your order is accepted and processing begins.</p>
        <p>Thank you for choosing our service!</p>
      </div>
    `
  }),

  orderAccepted: (orderData: any) => ({
    subject: `Order Accepted - ${orderData.order_id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Order Accepted!</h2>
        <p>Dear ${orderData.customer_name},</p>
        <p>Great news! Your order has been accepted and is now being processed.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> ${orderData.order_id}</p>
          <p><strong>Product:</strong> ${orderData.product_name}</p>
          <p><strong>Total Amount:</strong> ₹${orderData.total_amount}</p>
          <p><strong>Status:</strong> Processing</p>
        </div>
        
        <p>We'll keep you updated on the progress of your order.</p>
        <p>Thank you!</p>
      </div>
    `
  }),

  orderRejected: (orderData: any) => ({
    subject: `Order Cancelled - ${orderData.order_id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Order Cancelled</h2>
        <p>Dear ${orderData.customer_name},</p>
        <p>We regret to inform you that your order has been cancelled.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> ${orderData.order_id}</p>
          <p><strong>Product:</strong> ${orderData.product_name}</p>
          <p><strong>Total Amount:</strong> ₹${orderData.total_amount}</p>
          <p><strong>Status:</strong> Cancelled</p>
        </div>
        
        <p>If you have any questions, please contact our support team.</p>
        <p>We apologize for any inconvenience.</p>
      </div>
    `
  }),

  orderStatusUpdate: (orderData: any, newStatus: string) => ({
    subject: `Order Status Update - ${orderData.order_id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Order Status Update</h2>
        <p>Dear ${orderData.customer_name},</p>
        <p>Your order status has been updated.</p>
        
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> ${orderData.order_id}</p>
          <p><strong>Product:</strong> ${orderData.product_name}</p>
          <p><strong>Total Amount:</strong> ₹${orderData.total_amount}</p>
          <p><strong>New Status:</strong> ${newStatus}</p>
        </div>
        
        <p>We'll continue to keep you updated on the progress of your order.</p>
        <p>Thank you!</p>
      </div>
    `
  })
};

// Email service functions
export const emailService = {
  // Send order placed notification
  async sendOrderPlacedEmail(orderData: any) {
    try {
      const template = emailTemplates.orderPlaced(orderData);
      await transporter.sendMail({
        from: emailConfig.auth.user,
        to: orderData.customer_email,
        subject: template.subject,
        html: template.html,
      });
      console.log(`✅ Order placed email sent to ${orderData.customer_email}`);
    } catch (error) {
      console.error('❌ Failed to send order placed email:', error);
    }
  },

  // Send order accepted notification
  async sendOrderAcceptedEmail(orderData: any) {
    try {
      const template = emailTemplates.orderAccepted(orderData);
      await transporter.sendMail({
        from: emailConfig.auth.user,
        to: orderData.customer_email,
        subject: template.subject,
        html: template.html,
      });
      console.log(`✅ Order accepted email sent to ${orderData.customer_email}`);
    } catch (error) {
      console.error('❌ Failed to send order accepted email:', error);
    }
  },

  // Send order rejected notification
  async sendOrderRejectedEmail(orderData: any) {
    try {
      const template = emailTemplates.orderRejected(orderData);
      await transporter.sendMail({
        from: emailConfig.auth.user,
        to: orderData.customer_email,
        subject: template.subject,
        html: template.html,
      });
      console.log(`✅ Order rejected email sent to ${orderData.customer_email}`);
    } catch (error) {
      console.error('❌ Failed to send order rejected email:', error);
    }
  },

  // Send order status update notification
  async sendOrderStatusUpdateEmail(orderData: any, newStatus: string) {
    try {
      const template = emailTemplates.orderStatusUpdate(orderData, newStatus);
      await transporter.sendMail({
        from: emailConfig.auth.user,
        to: orderData.customer_email,
        subject: template.subject,
        html: template.html,
      });
      console.log(`✅ Order status update email sent to ${orderData.customer_email}`);
    } catch (error) {
      console.error('❌ Failed to send order status update email:', error);
    }
  },

  // Test email configuration
  async testEmailConfig() {
    try {
      await transporter.verify();
      console.log('✅ Email configuration is valid');
      return true;
    } catch (error) {
      console.error('❌ Email configuration is invalid:', error);
      return false;
    }
  }
};

export default emailService;
