const mysql = require('mysql2/promise');

// Database configuration - update these with your actual credentials
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Connected to database successfully!');
    
    // Test the connection
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('Database connection test:', rows[0]);
    
    // Check if tables exist
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('Dealers', 'categories', 'products')
    `, [dbConfig.database]);
    
    console.log('Existing tables:', tables.map(t => t.TABLE_NAME));
    
    // Insert sample dealer if not exists
    const [dealers] = await connection.execute('SELECT * FROM dealers WHERE email = ?', ['john@autopartspro.com']);
    
    if (dealers.length === 0) {
      console.log('Creating sample dealer...');
      await connection.execute(`
        INSERT INTO dealers (
          business_name, name, email, password_hash, phone, business_address, 
          city, state, pincode, tax_id, service_pincodes, service_types, is_verified, rating
        ) VALUES (
          'AutoParts Pro', 'John Doe', 'john@autopartspro.com', 
          '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '1234567890', '123 Main St',
          'New York', 'NY', '10001', 'TAX123456', '10001,10002,10003', 
          'PPF,Seat Cover,Tyre', TRUE, 4.5
        )
      `);
      console.log('Sample dealer created successfully!');
    } else {
      console.log('Sample dealer already exists');
    }
    
    // Get dealer ID
    const [dealerResult] = await connection.execute('SELECT dealer_id FROM dealers WHERE email = ?', ['john@autopartspro.com']);
    const dealerId = dealerResult[0].dealer_id;
    console.log('Dealer ID:', dealerId);
    
    // Insert sample categories
    const [categories] = await connection.execute('SELECT * FROM categories WHERE dealer_id = ?', [dealerId]);
    
    if (categories.length === 0) {
      console.log('Creating sample categories...');
      await connection.execute(`
        INSERT INTO categories (name, description, dealer_id) VALUES 
        ('Engine Parts', 'High-quality engine components and accessories', ?),
        ('Tyres & Wheels', 'Premium tyres and wheel accessories', ?),
        ('Interior Accessories', 'Car interior enhancement products', ?),
        ('Fluids & Lubricants', 'Engine oils and other automotive fluids', ?)
      `, [dealerId, dealerId, dealerId, dealerId]);
      console.log('Sample categories created successfully!');
    } else {
      console.log('Sample categories already exist');
    }
    
    // Get category IDs
    const [categoryResult] = await connection.execute('SELECT id, name FROM categories WHERE dealer_id = ?', [dealerId]);
    console.log('Available categories:', categoryResult);
    
    // Insert sample products
    const [products] = await connection.execute('SELECT * FROM products WHERE dealer_id = ?', [dealerId]);
    
    if (products.length === 0) {
      console.log('Creating sample products...');
      const engineCategoryId = categoryResult.find(c => c.name === 'Engine Parts')?.id;
      const tyresCategoryId = categoryResult.find(c => c.name === 'Tyres & Wheels')?.id;
      const fluidsCategoryId = categoryResult.find(c => c.name === 'Fluids & Lubricants')?.id;
      
      if (engineCategoryId && tyresCategoryId && fluidsCategoryId) {
        await connection.execute(`
          INSERT INTO products (
            name, description, sale_price, original_price, category_id, brand, 
            stock_quantity, dealer_id, product_condition, is_featured
          ) VALUES 
          ('Synthetic Engine Oil 5W-30', 'Premium synthetic engine oil for optimal performance', 45.99, 59.99, ?, 'Mobil', 42, ?, 'New', TRUE),
          ('All-Season Tyres 205/55R16', 'High-performance all-season tyres', 89.99, 119.99, ?, 'Michelin', 8, ?, 'New', TRUE),
          ('Brake Fluid DOT 4', 'High-quality brake fluid for all vehicles', 12.99, 15.99, ?, 'Castrol', 25, ?, 'New', FALSE),
          ('Air Filter Premium', 'High-flow air filter for better engine breathing', 18.99, 24.99, ?, 'K&N', 15, ?, 'New', FALSE)
        `, [engineCategoryId, dealerId, tyresCategoryId, dealerId, fluidsCategoryId, dealerId, engineCategoryId, dealerId]);
        console.log('Sample products created successfully!');
      }
    } else {
      console.log('Sample products already exist');
    }
    
    // Display final data
    const [finalCategories] = await connection.execute('SELECT * FROM categories WHERE dealer_id = ?', [dealerId]);
    const [finalProducts] = await connection.execute('SELECT * FROM products WHERE dealer_id = ?', [dealerId]);
    
    console.log('\n=== DATABASE SETUP COMPLETE ===');
    console.log(`Dealer ID: ${dealerId}`);
    console.log(`Categories: ${finalCategories.length}`);
    console.log(`Products: ${finalProducts.length}`);
    console.log('\nYou can now test the application with dealer_id:', dealerId);
    
  } catch (error) {
    console.error('Database setup error:', error);
    console.log('\nPlease make sure:');
    console.log('1. Your database server is running');
    console.log('2. You have created the database "dealer_auth"');
    console.log('3. You have run the SQL commands from DATABASE_SETUP.md');
    console.log('4. Your .env.local file has the correct database credentials');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase(); 