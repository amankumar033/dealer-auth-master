# Database Setup Guide

## Database Schema

### Dealers Table
```sql
CREATE TABLE Dealers (
  dealer_id INT AUTO_INCREMENT PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  business_address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  tax_id VARCHAR(50),
  service_pincodes TEXT,
  service_types TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

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
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NULL,
  shipping_address_line1 VARCHAR(100) NOT NULL,
  shipping_address_line2 VARCHAR(100) NULL,
  shipping_city VARCHAR(50) NOT NULL,
  shipping_state VARCHAR(50) NOT NULL,
  shipping_postal_code VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(50) NOT NULL,
  order_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  order_status VARCHAR(20) NULL DEFAULT 'Processing',
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NULL DEFAULT 0.00,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) NULL DEFAULT 'Pending',
  transaction_id VARCHAR(100) NULL,
  dealer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_order_date (order_date),
  INDEX idx_order_status (order_status),
  FOREIGN KEY (dealer_id) REFERENCES Dealers(dealer_id) ON DELETE CASCADE
);
```

### ServiceOrder Table
```sql
CREATE TABLE ServiceOrder (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NULL,
  shipping_address_line1 VARCHAR(100) NOT NULL,
  shipping_address_line2 VARCHAR(100) NULL,
  shipping_city VARCHAR(50) NOT NULL,
  shipping_state VARCHAR(50) NOT NULL,
  shipping_postal_code VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(50) NOT NULL,
  order_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  order_status VARCHAR(20) NULL DEFAULT 'Processing',
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NULL DEFAULT 0.00,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) NULL DEFAULT 'Pending',
  transaction_id VARCHAR(100) NULL,
  dealer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_order_date (order_date),
  INDEX idx_order_status (order_status),
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

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=dealer_auth
DB_PORT=3306
```

## Setup Instructions

1. Create a MySQL database named `dealer_auth`
2. Run the SQL commands above to create the tables
3. Create a `.env.local` file in your project root with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=dealer_auth
   DB_PORT=3306
   ```
4. Start the development server: `npm run dev`

## Sample Data (Optional)

You can insert sample data for testing:

```sql
-- Insert sample dealer (use a proper hashed password)
INSERT INTO Dealers (
  business_name, name, email, password_hash, phone, business_address, 
  city, state, pincode, tax_id, service_pincodes, service_types, is_verified, rating
) VALUES (
  'AutoParts Pro', 'John Doe', 'john@autopartspro.com', 
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '1234567890', '123 Main St',
  'New York', 'NY', '10001', 'TAX123456', '10001,10002,10003', 
  'PPF,Seat Cover,Tyre', TRUE, 4.5
);

-- Insert sample category
INSERT INTO categories (name, description, dealer_id) VALUES 
('Engine Parts', 'High-quality engine components', 1);

-- Insert sample product
INSERT INTO products (
  name, description, sale_price, original_price, category_id, brand, 
  stock_quantity, dealer_id
) VALUES (
  'Synthetic Engine Oil 5W-30', 'Premium synthetic engine oil', 45.99, 59.99, 1, 'Mobil', 42, 1
);
``` 