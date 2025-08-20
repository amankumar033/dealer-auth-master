const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
};

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
};

// Email templates
const emailTemplates = {
  orderStatusUpdate: (orderData, newStatus) => ({
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

async function testOrderEmailNotifications() {
  let connection;
  let transporter;
  
  try {
    console.log('🔍 Testing Order Email Notifications...\n');
    
    // Check email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('❌ Email credentials not found in .env.local file');
      console.log('Please create a .env.local file with your email credentials');
      return;
    }

    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');

    // Create email transporter
    transporter = nodemailer.createTransport(emailConfig);
    await transporter.verify();
    console.log('✅ Email configuration is valid');

    // Get a sample order
    const [orders] = await connection.execute(`
      SELECT o.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone, 
             d.business_address as dealer_address, d.pincode as dealer_pincode, 
             p.name as product_name, p.image_1 as product_image 
      FROM orders o 
      LEFT JOIN dealers d ON o.dealer_id = d.dealer_id 
      LEFT JOIN products p ON o.product_id = p.product_id 
      LIMIT 1
    `);

    if (orders.length === 0) {
      console.log('❌ No orders found in database');
      return;
    }

    const order = orders[0];
    console.log('📋 Found order:', {
      order_id: order.order_id,
      current_status: order.order_status,
      customer_email: order.customer_email,
      product_name: order.product_name
    });

    // Test different status updates
    const testStatuses = [
      'processing',
      'shipped', 
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned_refunded',
      'failed_delivery'
    ];

    console.log('\n📧 Testing email notifications for different status updates...\n');

    for (const newStatus of testStatuses) {
      try {
        console.log(`🔄 Testing status update to: ${newStatus}`);
        
        // Create email template
        const template = emailTemplates.orderStatusUpdate(order, newStatus);
        
        // Send test email
        const testEmail = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, // Send to yourself for testing
          subject: template.subject,
          html: template.html
        };
        
        const info = await transporter.sendMail(testEmail);
        console.log(`✅ Email sent successfully for status: ${newStatus}`);
        console.log(`   📧 Message ID: ${info.messageId}`);
        
        // Small delay between emails
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Failed to send email for status ${newStatus}:`, error.message);
      }
    }

    console.log('\n🎉 Email notification testing completed!');
    console.log('📧 Check your email inbox for test messages');
    console.log('💡 Each email represents a different order status update');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testOrderEmailNotifications().catch(console.error);


