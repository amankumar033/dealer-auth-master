const mysql = require('mysql2/promise');

// Simple slug generation function (same as in database.ts)
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function testProductWithSlug() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dealer_auth_db'
    });

    console.log('🔧 Testing product creation with slug generation...\n');

    // Test product data
    const testProducts = [
      {
        name: 'Engine Oil',
        description: 'High-quality engine oil for optimal performance',
        short_description: 'Premium engine oil',
        sale_price: 29.99,
        original_price: 39.99,
        rating: 4.5,
        category_id: 'CTR1_123456',
        brand: 'Mobil',
        stock_quantity: 100,
        dealer_id: 'DLR7_123456'
      },
      {
        name: 'Motor Oil 5W-30',
        description: 'Synthetic motor oil for modern engines',
        short_description: 'Synthetic 5W-30 oil',
        sale_price: 34.99,
        original_price: 44.99,
        rating: 4.8,
        category_id: 'CTR1_123456',
        brand: 'Castrol',
        stock_quantity: 75,
        dealer_id: 'DLR7_123456'
      },
      {
        name: 'Brake Pads & Rotors',
        description: 'Complete brake system replacement kit',
        short_description: 'Brake system kit',
        sale_price: 89.99,
        original_price: 119.99,
        rating: 4.6,
        category_id: 'CTR2_123456',
        brand: 'Brembo',
        stock_quantity: 25,
        dealer_id: 'DLR7_123456'
      }
    ];

    for (const product of testProducts) {
      // Generate slug
      const slug = generateSlug(product.name);
      console.log(`📝 Product: "${product.name}"`);
      console.log(`🔗 Generated slug: "${slug}"`);
      
      // Check if slug already exists
      const [existingProducts] = await connection.execute(
        'SELECT product_id, name, slug FROM products WHERE slug = ?',
        [slug]
      );
      
      if (existingProducts.length > 0) {
        console.log(`⚠️  Slug "${slug}" already exists for product: ${existingProducts[0].name}`);
      } else {
        console.log(`✅ Slug "${slug}" is unique`);
      }
      
      console.log('---');
    }

    // Show existing products with slugs
    console.log('\n📋 Current products with slugs:');
    const [existingProducts] = await connection.execute(
      'SELECT product_id, name, slug FROM products ORDER BY created_at DESC LIMIT 10'
    );
    
    existingProducts.forEach(product => {
      console.log(`  - ID: ${product.product_id}, Name: "${product.name}", Slug: "${product.slug}"`);
    });

  } catch (error) {
    console.error('❌ Error testing product with slug:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testProductWithSlug();

