const mysql = require('mysql2/promise');

// Database configuration - update these with your actual credentials
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function setupOrdersTable() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Connected to database successfully!');
    
    // Create Orders table with exact structure as specified
    console.log('Creating Orders table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        dealer_id INT NOT NULL,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(100) NOT NULL,
        customer_phone VARCHAR(20) NULL,
        shipping_address TEXT NOT NULL,
        shipping_pincode VARCHAR(10) NOT NULL,
        order_date TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        order_status VARCHAR(20) NULL DEFAULT 'Processing',
        total_amount DECIMAL(10,2) NOT NULL,
        tax_amount DECIMAL(10,2) NOT NULL,
        shipping_cost DECIMAL(10,2) NOT NULL,
        discount_amount DECIMAL(10,2) NULL DEFAULT 0.00,
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(20) NULL DEFAULT 'Pending',
        transaction_id VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dealer_id (dealer_id),
        INDEX idx_user_id (user_id),
        INDEX idx_order_date (order_date),
        INDEX idx_order_status (order_status),
        FOREIGN KEY (dealer_id) REFERENCES dealers(dealer_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
      )
    `);
    console.log('Orders table created successfully!');
    
    // Create Products table with exact structure as specified
    console.log('Creating Products table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        dealer_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sale_price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2) NOT NULL,
        rating DECIMAL(3,2) DEFAULT 0.00,
        image TEXT,
        category_id INT,
        brand VARCHAR(100),
        stock_quantity INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        is_hot_deal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dealer_id (dealer_id),
        INDEX idx_category_id (category_id),
        INDEX idx_is_active (is_active),
        FOREIGN KEY (dealer_id) REFERENCES dealers(dealer_id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
      )
    `);
    console.log('Products table created successfully!');
    
    // Create Categories table with exact structure as specified
    console.log('Creating Categories table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        category_id INT AUTO_INCREMENT PRIMARY KEY,
        dealer_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dealer_id (dealer_id),
        INDEX idx_is_active (is_active),
        FOREIGN KEY (dealer_id) REFERENCES dealers(dealer_id) ON DELETE CASCADE
      )
    `);
    console.log('Categories table created successfully!');
    
    // Create Dealers table with exact structure as specified
    console.log('Creating Dealers table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS dealers (
        dealer_id INT AUTO_INCREMENT PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        business_address TEXT NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        tax_id VARCHAR(50),
        is_verified BOOLEAN DEFAULT FALSE,
        rating DECIMAL(3,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_is_verified (is_verified)
      )
    `);
    console.log('Dealers table created successfully!');
    
    // Check if tables exist
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('orders', 'products', 'categories', 'dealers')
    `, [dbConfig.database]);
    
    console.log('Created tables:', tables.map(t => t.TABLE_NAME));
    
    // Display final data counts (no sample data insertion)
    const [finalOrders] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    const [finalProducts] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const [finalCategories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    const [finalDealers] = await connection.execute('SELECT COUNT(*) as count FROM dealers');
    
    console.log('\n=== TABLES SETUP COMPLETE ===');
    console.log(`Orders: ${finalOrders[0].count} (dynamic data only)`);
    console.log(`Products: ${finalProducts[0].count} (dynamic data only)`);
    console.log(`Categories: ${finalCategories[0].count} (dynamic data only)`);
    console.log(`Dealers: ${finalDealers[0].count} (dynamic data only)`);
    console.log('\nYou can now use the API endpoints:');
    console.log('- GET /api/orders?dealer_id=<id>');
    console.log('- POST /api/orders');
    console.log('- GET /api/orders/<id>?dealer_id=<id>');
    console.log('- PUT /api/orders/<id>?dealer_id=<id>');
    console.log('- DELETE /api/orders/<id>?dealer_id=<id>');
    console.log('\nAnd other endpoints:');
    console.log('- GET /api/products?dealer_id=<id>');
    console.log('- GET /api/categories?dealer_id=<id>');
    console.log('- GET /api/dealers/<id>');
    
  } catch (error) {
    console.error('Tables setup error:', error);
    console.log('\nPlease make sure:');
    console.log('1. Your database server is running');
    console.log('2. You have created the database "kriptocar"');
    console.log('3. Your .env.local file has the correct database credentials');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupOrdersTable(); 