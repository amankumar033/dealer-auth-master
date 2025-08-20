const mysql = require('mysql2/promise');

// Simple slug generation function for testing
function generateBaseSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Unique slug generation function (same logic as in database.ts)
async function generateUniqueSlug(connection, name) {
  const baseSlug = generateBaseSlug(name);
  
  // Check if the base slug already exists
  const [existingSlugs] = await connection.execute(
    'SELECT slug FROM products WHERE slug LIKE ? ORDER BY slug',
    [`${baseSlug}%`]
  );
  
  if (existingSlugs.length === 0) {
    return baseSlug;
  }
  
  // Find the highest number suffix
  let maxNumber = 0;
  existingSlugs.forEach((row) => {
    const slug = row.slug;
    if (slug === baseSlug) {
      maxNumber = Math.max(maxNumber, 1);
    } else if (slug.startsWith(baseSlug) && slug !== baseSlug) {
      const suffix = slug.substring(baseSlug.length);
      const number = parseInt(suffix);
      if (!isNaN(number)) {
        maxNumber = Math.max(maxNumber, number);
      }
    }
  });
  
  // Return slug with next available number
  return maxNumber === 0 ? baseSlug : `${baseSlug}${maxNumber + 1}`;
}

async function testUniqueSlugGeneration() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'dealer_auth_db'
    });

    console.log('🔧 Testing unique slug generation...\n');

    // Test cases with potential duplicates
    const testProducts = [
      'Engine Oil',
      'Engine Oil', // Duplicate
      'Engine Oil', // Another duplicate
      'Motor Oil 5W-30',
      'Motor Oil 5W-30', // Duplicate
      'Brake Pads & Rotors',
      'Brake Pads & Rotors', // Duplicate
      'Air Filter (Premium)',
      'Spark Plugs NGK',
      'Spark Plugs NGK', // Duplicate
      'Spark Plugs NGK', // Another duplicate
      'Tire Pressure Sensor',
      'Oil Filter - High Performance',
      'Windshield Wiper Blades'
    ];

    console.log('📝 Testing slug generation for each product:\n');

    for (let i = 0; i < testProducts.length; i++) {
      const productName = testProducts[i];
      const baseSlug = generateBaseSlug(productName);
      const uniqueSlug = await generateUniqueSlug(connection, productName);
      
      console.log(`${i + 1}. "${productName}"`);
      console.log(`   Base slug: "${baseSlug}"`);
      console.log(`   Unique slug: "${uniqueSlug}"`);
      
      if (baseSlug !== uniqueSlug) {
        console.log(`   ✅ Added suffix: "${uniqueSlug.substring(baseSlug.length)}"`);
      } else {
        console.log(`   ✅ No suffix needed (first occurrence)`);
      }
      console.log('');
    }

    // Show all existing slugs in database
    console.log('📋 Current slugs in database:');
    const [existingProducts] = await connection.execute(
      'SELECT product_id, name, slug FROM products WHERE slug IS NOT NULL ORDER BY slug'
    );
    
    if (existingProducts.length === 0) {
      console.log('   No products with slugs found in database');
    } else {
      existingProducts.forEach(product => {
        console.log(`   - "${product.name}" → "${product.slug}"`);
      });
    }

    // Test specific scenarios
    console.log('\n🎯 Testing specific scenarios:');
    
    // Test with existing slugs
    const testScenarios = [
      'Engine Oil',
      'engine-oil',
      'Engine Oil',
      'engine-oil2',
      'Engine Oil'
    ];

    for (const scenario of testScenarios) {
      const uniqueSlug = await generateUniqueSlug(connection, scenario);
      console.log(`   "${scenario}" → "${uniqueSlug}"`);
    }

  } catch (error) {
    console.error('❌ Error testing unique slug generation:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testUniqueSlugGeneration();

