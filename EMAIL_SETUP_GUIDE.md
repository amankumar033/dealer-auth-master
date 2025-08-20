# Email Setup Guide for Order Notifications

This guide will help you set up email notifications for order status updates using nodemailer.

## 1. Environment Variables

Create a `.env.local` file in your project root and add the following email configuration:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 2. Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication

### Step 2: Generate App Password
1. Go to Google Account settings
2. Navigate to Security > 2-Step Verification
3. Click on "App passwords"
4. Generate a new app password for "Mail"
5. Use this password as your `EMAIL_PASS`

### Step 3: Update Environment Variables
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## 3. Alternative Email Providers

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

## 4. Testing Email Configuration

Run the following command to test your email configuration:

```bash
node -e "
const emailService = require('./src/lib/email.js');
emailService.testEmailConfig().then(result => {
  console.log('Email config test result:', result);
  process.exit(0);
}).catch(err => {
  console.error('Email config test failed:', err);
  process.exit(1);
});
"
```

## 5. Email Templates

The system includes the following email templates:

- **Order Placed**: Sent when a new order is created
- **Order Accepted**: Sent when dealer accepts a pending order
- **Order Rejected**: Sent when dealer rejects a pending order
- **Status Update**: Sent when order status is changed

## 6. Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - Ensure you're using an app password, not your regular password
   - Check that 2-Factor Authentication is enabled

2. **Connection Timeout**
   - Verify the SMTP host and port are correct
   - Check your firewall settings

3. **Emails Not Sending**
   - Check the console logs for error messages
   - Verify environment variables are loaded correctly

### Debug Mode

To enable debug logging, add this to your environment:

```env
DEBUG=nodemailer:*
```

## 7. Security Notes

- Never commit your `.env.local` file to version control
- Use app passwords instead of regular passwords
- Consider using environment-specific configurations for production

## 8. Production Deployment

For production deployment:

1. Use a dedicated email service (SendGrid, Mailgun, etc.)
2. Set up proper SPF and DKIM records
3. Monitor email delivery rates
4. Implement email queuing for high-volume scenarios


