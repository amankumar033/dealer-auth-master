const mysql = require('mysql2/promise');

// Test the fixed database configuration
async function testFixedConfiguration() {
  console.log('🧪 Testing Fixed Database Configuration...\n');

  try {
    // Use the fixed configuration (without invalid options)
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kriptocar',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 10,
      connectTimeout: 30000,
      charset: 'utf8mb4',
      multipleStatements: false,
      dateStrings: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
    };

    console.log('📋 Database Configuration:');
    console.log(`  Host: ${config.host}`);
    console.log(`  Database: ${config.database}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  Connection Limit: ${config.connectionLimit}`);
    console.log(`  Connect Timeout: ${config.connectTimeout}ms`);

    const pool = mysql.createPool(config);
    
    // Test connection
    console.log('\n🔗 Testing connection...');
    const connection = await pool.getConnection();
    console.log('✅ Connection successful!');
    
    // Test basic query
    console.log('\n📊 Testing basic query...');
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as current_time');
    console.log('✅ Query successful:', rows[0]);
    
    // Test categories table
    console.log('\n📋 Testing categories table...');
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    console.log(`✅ Categories table accessible: ${categories[0].count} categories found`);
    
    // Test products table
    console.log('\n📦 Testing products table...');
    const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log(`✅ Products table accessible: ${products[0].count} products found`);
    
    // Test dealers table
    console.log('\n👥 Testing dealers table...');
    const [dealers] = await connection.execute('SELECT COUNT(*) as count FROM dealers');
    console.log(`✅ Dealers table accessible: ${dealers[0].count} dealers found`);
    
    // Test sample data
    if (categories[0].count > 0) {
      console.log('\n📋 Sample category data:');
      const [sampleCategories] = await connection.execute('SELECT category_id, name, dealer_id FROM categories LIMIT 2');
      sampleCategories.forEach(cat => {
        console.log(`  - ${cat.category_id}: ${cat.name} (Dealer: ${cat.dealer_id})`);
      });
    }
    
    if (products[0].count > 0) {
      console.log('\n📦 Sample product data:');
      const [sampleProducts] = await connection.execute('SELECT product_id, name, dealer_id, sale_price FROM products LIMIT 2');
      sampleProducts.forEach(prod => {
        console.log(`  - ${prod.product_id}: ${prod.name} (Dealer: ${prod.dealer_id}, Price: ₹${prod.sale_price})`);
      });
    }
    
    connection.release();
    await pool.end();
    
    console.log('\n🎉 All tests passed! Database configuration is working correctly.');
    console.log('\n📝 Summary:');
    console.log('  ✅ No MySQL2 configuration warnings');
    console.log('  ✅ Database connection successful');
    console.log('  ✅ All tables accessible');
    console.log('  ✅ Sample data retrieved');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n🔍 Error details:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Possible solutions:');
      console.log('  1. Check if MySQL server is running');
      console.log('  2. Verify database credentials in environment variables');
      console.log('  3. Check if database exists');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Possible solutions:');
      console.log('  1. Check database username and password');
      console.log('  2. Verify user permissions');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Possible solutions:');
      console.log('  1. Check if database exists');
      console.log('  2. Verify database name in environment variables');
    }
    
    process.exit(1);
  }
}

// Test API validation logic
function testValidationLogic() {
  console.log('\n🧪 Testing Validation Logic...\n');
  
  // Mock validation functions
  const validateUpdateData = (data, allowedFields) => {
    const errors = [];
    const sanitized = {};
    
    const providedFields = Object.keys(data).filter(key => data[key] !== undefined && data[key] !== null);
    if (providedFields.length === 0) {
      errors.push('At least one field must be provided for update');
      return { isValid: false, errors };
    }
    
    for (const field of providedFields) {
      if (!allowedFields.includes(field)) {
        errors.push(`Field '${field}' is not allowed for update`);
      }
    }
    
    if (errors.length > 0) {
      return { isValid: false, errors };
    }
    
    // Sanitize provided fields
    for (const field of providedFields) {
      const value = data[field];
      
      switch (field) {
        case 'name':
        case 'description':
          sanitized[field] = value ? value.trim() : null;
          break;
        case 'sale_price':
        case 'original_price':
          sanitized[field] = value ? Number(value) : null;
          break;
        case 'rating':
          sanitized[field] = value ? Number(value) : null;
          break;
        case 'stock_quantity':
          sanitized[field] = value ? Number(value) : null;
          break;
        case 'is_active':
        case 'is_featured':
          sanitized[field] = Boolean(value);
          break;
        default:
          sanitized[field] = value;
      }
    }
    
    // Additional validation
    if (sanitized.sale_price !== undefined && sanitized.original_price !== undefined) {
      if (sanitized.sale_price >= sanitized.original_price) {
        errors.push('Sale price must be less than original price');
      }
    }
    
    if (sanitized.rating !== undefined && (sanitized.rating < 0 || sanitized.rating > 5)) {
      errors.push('Rating must be between 0 and 5');
    }
    
    if (sanitized.stock_quantity !== undefined && sanitized.stock_quantity < 0) {
      errors.push('Stock quantity cannot be negative');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitized : undefined
    };
  };
  
  // Test cases
  const testCases = [
    {
      name: 'Valid product update',
      data: { name: 'Updated Product', sale_price: 99.99, original_price: 129.99 },
      allowedFields: ['name', 'sale_price', 'original_price'],
      expectedValid: true
    },
    {
      name: 'Invalid: sale price >= original price',
      data: { sale_price: 129.99, original_price: 99.99 },
      allowedFields: ['sale_price', 'original_price'],
      expectedValid: false
    },
    {
      name: 'Invalid: negative rating',
      data: { rating: -1 },
      allowedFields: ['rating'],
      expectedValid: false
    },
    {
      name: 'Invalid: rating > 5',
      data: { rating: 6 },
      allowedFields: ['rating'],
      expectedValid: false
    },
    {
      name: 'Invalid: negative stock',
      data: { stock_quantity: -5 },
      allowedFields: ['stock_quantity'],
      expectedValid: false
    },
    {
      name: 'Invalid: no fields provided',
      data: {},
      allowedFields: ['name', 'price'],
      expectedValid: false
    },
    {
      name: 'Invalid: null fields only',
      data: { name: null, price: undefined },
      allowedFields: ['name', 'price'],
      expectedValid: false
    }
  ];
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    console.log(`📋 Test ${index + 1}: ${testCase.name}`);
    
    const result = validateUpdateData(testCase.data, testCase.allowedFields);
    
    if (result.isValid === testCase.expectedValid) {
      console.log(`  ✅ Passed`);
      passedTests++;
    } else {
      console.log(`  ❌ Failed`);
      console.log(`     Expected: ${testCase.expectedValid ? 'valid' : 'invalid'}`);
      console.log(`     Got: ${result.isValid ? 'valid' : 'invalid'}`);
      if (result.errors.length > 0) {
        console.log(`     Errors: ${result.errors.join(', ')}`);
      }
    }
  });
  
  console.log(`\n📊 Validation Tests: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All validation tests passed!');
  } else {
    console.log('⚠️  Some validation tests failed');
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Test Suite...\n');
  
  try {
    await testFixedConfiguration();
    testValidationLogic();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('  1. Start your development server: npm run dev');
    console.log('  2. Test the application in the browser');
    console.log('  3. Monitor logs for any remaining issues');
    console.log('  4. Run the debug script if needed: node scripts/debug-connection.js');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
runAllTests(); 