# Order Email Notifications Guide

This guide explains how email notifications work for all order status updates in the system.

## 📧 **Email Notifications Overview**

The system automatically sends email notifications for **ALL** order status changes, including:

### **1. Order Acceptance/Rejection**
- ✅ **Accept Order** → Status: `pending` → `processing` + Email sent
- ✅ **Reject Order** → Status: `pending` → `cancelled` + Email sent

### **2. Manual Status Updates**
- ✅ **Any status change** via dropdown → Email sent with new status
- ✅ **Mark as Delivered** → Status: `delivered` + Email sent
- ✅ **Cancel Order** → Status: `cancelled` + Email sent

### **3. All Available Status Options**
- `pending` - Order received, awaiting dealer approval
- `processing` - Order accepted, being prepared
- `shipped` - Order dispatched from warehouse
- `out_for_delivery` - Order with delivery partner
- `delivered` - Order successfully delivered
- `cancelled` - Order rejected by dealer
- `returned_refunded` - Order returned and refunded
- `failed_delivery` - Delivery attempt failed

## 🔧 **How It Works**

### **API Level**
All order update APIs automatically trigger email notifications:

1. **`PUT /api/orders/[id]`** - Status updates with email
2. **`POST /api/orders/[id]/accept`** - Accept order with email
3. **`POST /api/orders/[id]/reject`** - Reject order with email

### **Frontend Level**
All UI actions trigger email notifications:

1. **Accept/Reject buttons** for pending orders
2. **Status dropdown** in OrderStatusManager
3. **"Mark as Delivered"** button in OrderDetailsPopup

## 📋 **Email Templates**

### **Order Status Update Email**
```
Subject: Order Status Update - [ORDER_ID]
Content:
- Customer name
- Order ID
- Product name
- Total amount
- New status
- Professional styling
```

### **Order Accepted Email**
```
Subject: Order Accepted - [ORDER_ID]
Content:
- Confirmation message
- Order details
- Next steps
```

### **Order Rejected Email**
```
Subject: Order Cancelled - [ORDER_ID]
Content:
- Cancellation notice
- Order details
- Support contact
```

## 🧪 **Testing Email Notifications**

### **Test 1: Basic Email Configuration**
```bash
node scripts/test-email-config.js
```

### **Test 2: Order Email Notifications**
```bash
node scripts/test-order-email-notifications.js
```

### **Test 3: Manual Testing**
1. Create a `.env.local` file with your email credentials
2. Restart your Next.js application
3. Go to Orders page
4. Try different status updates
5. Check your email inbox

## ⚙️ **Configuration Required**

### **Environment Variables**
Create `.env.local` file:
```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### **Gmail Setup**
1. Enable 2-Factor Authentication
2. Generate App Password
3. Use App Password in EMAIL_PASS

## 🎯 **User Interface Features**

### **OrderStatusManager Component**
- ✅ Accept/Reject buttons for pending orders
- ✅ Status dropdown with all 8 options
- ✅ Real-time email notifications
- ✅ Visual status indicators

### **OrderDetailsPopup Component**
- ✅ "Mark as Delivered" button
- ✅ Status color coding
- ✅ Email notifications on all updates

### **OrdersManager Component**
- ✅ Status filtering
- ✅ Enhanced dropdown styling
- ✅ Real-time updates

## 🔍 **Monitoring & Debugging**

### **Console Logs**
Check console for email status:
```
✅ Order status update email sent to customer@example.com
❌ Failed to send order status update email: [error]
```

### **Email Delivery**
- Emails are sent to `order.customer_email`
- Check spam folder if emails not received
- Verify email configuration with test scripts

## 🚀 **Benefits**

1. **Automatic Notifications** - No manual email sending required
2. **Professional Templates** - Consistent, branded emails
3. **Real-time Updates** - Customers informed immediately
4. **Error Handling** - System continues working even if email fails
5. **Comprehensive Coverage** - All status changes trigger emails

## 📞 **Support**

If email notifications are not working:

1. **Check email configuration** with test scripts
2. **Verify .env.local file** exists and has correct credentials
3. **Restart application** after configuration changes
4. **Check console logs** for error messages
5. **Test with different email providers** if needed

## 🎉 **Success Indicators**

- ✅ Email test script runs successfully
- ✅ Order status updates trigger console logs
- ✅ Customers receive email notifications
- ✅ All 8 status options work with emails
- ✅ UI updates immediately after status changes


