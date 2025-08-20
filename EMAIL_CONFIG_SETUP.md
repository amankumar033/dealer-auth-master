# Email Configuration Setup

To enable email notifications for order status updates, please follow these steps:

## 1. Create Environment File

Create a `.env.local` file in your project root with the following email configuration:

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
Replace the placeholders in your `.env.local` file:
```env
EMAIL_USER=your-actual-gmail@gmail.com
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

## 4. Test Email Configuration

After setting up your credentials, restart your Next.js application and test the email functionality by:

1. Creating a new order
2. Accepting/rejecting an order
3. Updating order status

You should see email logs in the console indicating successful email sending.

## 5. Troubleshooting

If emails are not sending:
1. Check that your `.env.local` file is in the project root
2. Verify your email credentials are correct
3. Ensure 2-Factor Authentication is enabled (for Gmail)
4. Check the console for error messages
5. Restart your Next.js application after making changes

## 6. Security Notes

- Never commit your `.env.local` file to version control
- Use app passwords instead of regular passwords
- Keep your email credentials secure


