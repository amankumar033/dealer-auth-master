const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306')
};

async function testProductNotificationMetadata() {
  let connection;
  
  try {
    console.log('🔍 Testing product notification metadata...');
    
    // Create connection
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Get the latest product_created notification
    const notifications = await connection.execute(
      'SELECT * FROM notifications WHERE type = "product_created" ORDER BY created_at DESC LIMIT 1',
      []
    );
    
    if (notifications[0].length === 0) {
      console.log('❌ No product_created notifications found');
      console.log('💡 Create a product first to test the metadata');
      return;
    }
    
    const notification = notifications[0][0];
    console.log('📋 Found notification:', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      created_at: notification.created_at
    });
    
    // Parse and display metadata
    if (notification.metadata) {
      const metadata = JSON.parse(notification.metadata);
      console.log('\n📊 Notification Metadata:');
      console.log('========================');
      
      // Basic info
      console.log('Basic Info:');
      console.log(`  - Product ID: ${metadata.productId}`);
      console.log(`  - Product Name: ${metadata.productName}`);
      console.log(`  - Dealer ID: ${metadata.dealerId}`);
      console.log(`  - Action URL: ${metadata.actionUrl}`);
      
      // Product data
      if (metadata.productData) {
        console.log('\nProduct Data:');
        console.log('=============');
        console.log(`  - Name: ${metadata.productData.name}`);
        console.log(`  - Description: ${metadata.productData.description}`);
        console.log(`  - Short Description: ${metadata.productData.short_description}`);
        console.log(`  - Sale Price: ₹${metadata.productData.sale_price}`);
        console.log(`  - Original Price: ₹${metadata.productData.original_price}`);
        console.log(`  - Rating: ${metadata.productData.rating}`);
        console.log(`  - Category ID: ${metadata.productData.category_id}`);
        console.log(`  - Brand: ${metadata.productData.brand}`);
        console.log(`  - Stock Quantity: ${metadata.productData.stock_quantity}`);
        console.log(`  - Is Active: ${metadata.productData.is_active}`);
        console.log(`  - Is Featured: ${metadata.productData.is_featured}`);
        console.log(`  - Is Hot Deal: ${metadata.productData.is_hot_deal}`);
        console.log(`  - Images Count: ${metadata.productData.images?.length || 0}`);
        console.log(`  - Created At: ${metadata.productData.created_at}`);
        console.log(`  - Updated At: ${metadata.productData.updated_at}`);
        
        // Check if description is included
        if (metadata.productData.description) {
          console.log('\n✅ SUCCESS: Product description is included in metadata!');
          console.log(`Description: "${metadata.productData.description}"`);
        } else {
          console.log('\n❌ WARNING: Product description is missing from metadata');
        }
        
        // Check if all required fields are present
        const requiredFields = [
          'name', 'description', 'short_description', 'sale_price', 
          'original_price', 'rating', 'category_id', 'brand', 
          'stock_quantity', 'is_active', 'is_featured', 'is_hot_deal'
        ];
        
        const missingFields = requiredFields.filter(field => 
          !metadata.productData[field] && metadata.productData[field] !== 0
        );
        
        if (missingFields.length === 0) {
          console.log('\n✅ SUCCESS: All product fields are included in metadata!');
        } else {
          console.log('\n❌ WARNING: Missing fields in metadata:', missingFields);
        }
        
      } else {
        console.log('\n❌ ERROR: No productData found in metadata');
        console.log('Available metadata keys:', Object.keys(metadata));
      }
      
    } else {
      console.log('\n❌ ERROR: No metadata found in notification');
    }
    
  } catch (error) {
    console.error('❌ Error testing notification metadata:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testProductNotificationMetadata(); 