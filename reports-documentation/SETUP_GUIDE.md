# Quick Setup Guide

## 1. Create Environment File

Create a `.env.local` file in your project root with your database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dealer_auth
DB_PORT=3306
```

## 2. Create Database Tables

Run these SQL commands in your PHPMyAdmin:

```sql
-- Create categories table
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create products table
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
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_dealer_id (dealer_id),
  INDEX idx_category_id (category_id)
);

-- Insert sample data
INSERT INTO categories (name, slug, description, is_active, is_featured) VALUES
('Engine Parts', 'engine-parts', 'High-quality engine components and parts', TRUE, TRUE),
('Tires & Wheels', 'tires-wheels', 'Premium tires and wheel accessories', TRUE, FALSE);
```

## 3. Start the Application

```bash
npm run dev
```

## 4. Test the Features

1. Go to `/dashboard`
2. Click on "Products" tab
3. Click "Add Product" to create a new product
4. Use the increment/decrement buttons (▲▼) to adjust values
5. Save the product - it will be stored in your database
6. Edit or delete products as needed

## Fixed Issues:

✅ **Database Connection**: Now connects to real PHPMyAdmin database
✅ **Auto-appending 0**: Fixed form input handling
✅ **Increment/Decrement Buttons**: Added ▲▼ buttons for numeric fields
✅ **Real-time Updates**: Changes are immediately saved to database

## Features:

- **Increment/Decrement Buttons**: Click ▲ to increase by 1, ▼ to decrease by 1
- **Database Integration**: All CRUD operations now work with your MySQL database
- **Form Validation**: Proper input handling without auto-appending zeros
- **Dealer Authorization**: Only the dealer who created a product can edit/delete it 