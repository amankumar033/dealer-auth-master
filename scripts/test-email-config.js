const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

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

async function testEmailConfig() {
  console.log('🔍 Testing Email Configuration...\n');
  
  // Check if environment variables are set
  console.log('📋 Environment Variables:');
  console.log('  EMAIL_HOST:', process.env.EMAIL_HOST || 'Not set');
  console.log('  EMAIL_PORT:', process.env.EMAIL_PORT || 'Not set');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
  console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
  console.log();

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials not found in .env.local file');
    console.log('Please create a .env.local file with your email credentials');
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport(emailConfig);
    
    // Verify connection
    console.log('🔌 Testing connection...');
    await transporter.verify();
    console.log('✅ Email configuration is valid!');
    
    // Test sending email
    console.log('\n📧 Testing email sending...');
    const testEmail = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'Test Email - Order Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Test Successful!</h2>
          <p>This is a test email from your Order Management System.</p>
          <p>If you received this email, your email configuration is working correctly.</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Configuration Details:</h3>
            <p><strong>Host:</strong> ${process.env.EMAIL_HOST}</p>
            <p><strong>Port:</strong> ${process.env.EMAIL_PORT}</p>
            <p><strong>User:</strong> ${process.env.EMAIL_USER}</p>
          </div>
          <p>You can now use the order management system with email notifications!</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    
  } catch (error) {
    console.error('❌ Email configuration test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('  1. Your email address is correct');
      console.log('  2. Your password/app password is correct');
      console.log('  3. 2-Factor Authentication is enabled (for Gmail)');
      console.log('  4. You\'re using an app password, not your regular password');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection failed. Please check:');
      console.log('  1. Your internet connection');
      console.log('  2. The SMTP host and port are correct');
      console.log('  3. Your firewall settings');
    }
  }
}

// Run the test
testEmailConfig().catch(console.error);


