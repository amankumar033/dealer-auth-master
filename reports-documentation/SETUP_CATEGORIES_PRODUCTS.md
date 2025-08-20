# Categories and Products Setup Guide

This guide will help you set up the categories, products, and orders functionality in your dealer authentication system.

## Prerequisites

1. **MySQL Database Server** - Make sure your MySQL server is running
2. **PHPMyAdmin** - For database management (optional but recommended)
3. **Node.js** - For running the application

## Step 1: Create .env.local File

Create a `.env.local` file in your project root with the following content:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dealer_auth
DB_PORT=3306
NEXTAUTH_SECRET=kriptocar
```

**Important:** Replace `your_mysql_password` with your actual MySQL password.

## Step 2: Database Setup

### Option A: Using the Setup Scripts (Recommended)

1. Run the database setup script:
   ```bash
   node scripts/setup-database.js
   ```

2. Run the orders table setup script:
   ```bash
   node scripts/setup-orders-table.js
   ```

3. These scripts will:
   - Test your database connection
   - Create sample dealer data
   - Create sample categories
   - Create sample products
   - Create orders and order_items tables
   - Create sample orders
   - Display the dealer_id for testing

### Option B: Manual Database Setup

1. Create the database:
   ```sql
   CREATE DATABASE dealer_auth;
   USE dealer_auth;
   ```

2. Run the SQL commands from `DATABASE_SETUP.md` to create all tables including orders

3. Insert sample data manually using the SQL commands provided in `DATABASE_SETUP.md`

## Step 3: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Login with the sample dealer credentials:
   - Email: `john@autopartspro.com`
   - Password: `password123`

4. Navigate to the dashboard and test:
   - **Categories Tab**: View, create, edit, and delete categories
   - **Products Tab**: View, create, edit, and delete products

## Step 4: API Testing

You can test the API endpoints directly:

### Categories API
- **GET** `/api/categories?dealer_id=1` - Get all categories for a dealer
- **POST** `/api/categories` - Create a new category
- **PUT** `/api/categories/[id]?dealer_id=1` - Update a category
- **DELETE** `/api/categories/[id]?dealer_id=1` - Delete a category

### Products API
- **GET** `/api/products?dealer_id=1` - Get all products for a dealer
- **GET** `/api/products?dealer_id=1&category_id=1` - Get products by category
- **POST** `/api/products` - Create a new product
- **PUT** `/api/products/[id]?dealer_id=1` - Update a product
- **DELETE** `/api/products/[id]?dealer_id=1` - Delete a product

### Orders API
- **GET** `/api/orders?dealer_id=1` - Get all orders for a dealer
- **GET** `/api/orders?dealer_id=1&status=pending` - Get orders by status
- **POST** `/api/orders` - Create a new order
- **GET** `/api/orders/[id]?dealer_id=1` - Get a specific order
- **PUT** `/api/orders/[id]?dealer_id=1` - Update an order
- **DELETE** `/api/orders/[id]?dealer_id=1` - Delete an order

### Test Orders API
You can test the orders API functionality:
```bash
node scripts/test-orders-api.js
```

## Features Implemented

### Categories Management
- ✅ Create categories with dealer_id
- ✅ Update categories (only by owner)
- ✅ Delete categories (only by owner)
- ✅ View categories filtered by dealer_id
- ✅ Active/Inactive status
- ✅ Featured categories
- ✅ Category description

### Products Management
- ✅ Create products with dealer_id and category_id
- ✅ Update products (only by owner)
- ✅ Delete products (only by owner)
- ✅ View products filtered by dealer_id
- ✅ Filter products by category
- ✅ Product details (name, description, prices, stock, etc.)
- ✅ Product status (active, featured, hot deal)
- ✅ Product images
- ✅ Stock management

### Orders Management
- ✅ Create orders with customer information
- ✅ Order items with product details
- ✅ Order status tracking (pending, confirmed, processing, shipped, delivered, cancelled)
- ✅ Payment status tracking (pending, paid, failed, refunded)
- ✅ Payment method support (credit_card, debit_card, paypal, bank_transfer, cash_on_delivery)
- ✅ Shipping address management
- ✅ Tax, shipping, and discount calculations
- ✅ Transaction ID tracking
- ✅ View orders filtered by dealer_id and status
- ✅ Update order status and payment information
- ✅ Delete orders (with cascade to order items)

### Security Features
- ✅ Dealer authentication required
- ✅ Dealer can only manage their own categories, products, and orders
- ✅ Proper authorization checks in API routes
- ✅ Input validation and error handling

## Database Schema

### Categories Table
```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  dealer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dealer_id) REFERENCES Dealers(dealer_id) ON DELETE CASCADE
);
```

### Products Table
```sql
CREATE TABLE products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sale_price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0.00,
  image VARCHAR(500),
  category_id INT NOT NULL,
  brand VARCHAR(255),
  product_condition ENUM('New', 'Used', 'Refurbished') DEFAULT 'New',
  material VARCHAR(255),
  stock_quantity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_hot_deal BOOLEAN DEFAULT FALSE,
  dealer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (dealer_id) REFERENCES Dealers(dealer_id) ON DELETE CASCADE
);
```

### Orders Table
```sql
CREATE TABLE orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  shipping_address_line1 VARCHAR(255) NOT NULL,
  shipping_address_line2 VARCHAR(255),
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100) NOT NULL,
  shipping_postal_code VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(100) NOT NULL,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  order_status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  shipping_cost DECIMAL(10,2) DEFAULT 0.00,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_method ENUM('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery') NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  transaction_id VARCHAR(255),
  dealer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dealer_id) REFERENCES Dealers(dealer_id) ON DELETE CASCADE
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check if MySQL server is running
   - Verify database credentials in `.env.local`
   - Ensure database `dealer_auth` exists

2. **Tables Not Found**
   - Run the SQL commands from `DATABASE_SETUP.md`
   - Or use the setup scripts: `node scripts/setup-database.js` and `node scripts/setup-orders-table.js`

3. **Authentication Issues**
   - Make sure you're logged in as a dealer
   - Check if the dealer exists in the database

4. **API Errors**
   - Check browser console for error messages
   - Verify dealer_id is being passed correctly
   - Ensure you have proper permissions

### Getting Help

If you encounter any issues:

1. Check the browser console for error messages
2. Check the terminal for server logs
3. Verify your database connection
4. Ensure all environment variables are set correctly

## Next Steps

Once the basic setup is working, you can:

1. **Add more dealers** - Create additional dealer accounts
2. **Customize categories** - Add your own category types
3. **Add product images** - Implement image upload functionality
4. **Add inventory management** - Implement stock tracking
5. **Add order management UI** - Create order management interface in dashboard
6. **Add customer portal** - Create customer-facing interface
7. **Add payment integration** - Integrate with payment gateways
8. **Add shipping integration** - Integrate with shipping providers

## Sample Data

The setup scripts create the following sample data:

### Sample Dealer
- **Email**: john@autopartspro.com
- **Password**: password123
- **Business**: AutoParts Pro

### Sample Categories
- Engine Parts
- Tyres & Wheels
- Interior Accessories
- Fluids & Lubricants

### Sample Products
- Synthetic Engine Oil 5W-30
- All-Season Tyres 205/55R16
- Brake Fluid DOT 4
- Air Filter Premium

### Sample Orders
- Order from John Smith (pending)
- Order from Jane Doe (confirmed, paid)

You can use this data to test the system or replace it with your own data. 