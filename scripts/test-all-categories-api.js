const fetch = require('node-fetch');

async function testAllCategoriesAPI() {
  console.log('🧪 Testing All Categories API...\n');
  
  try {
    // Test the show_all=true endpoint
    console.log('Testing GET /api/categories?show_all=true');
    const response = await fetch('http://localhost:3002/api/categories?show_all=true');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success! Found ${data.categories.length} categories`);
      
      console.log('\n📋 Categories:');
      data.categories.forEach((category, index) => {
        console.log(`${index + 1}. ${category.name} (ID: ${category.id})`);
        console.log(`   Dealer ID: ${category.dealer_id}`);
        console.log(`   Status: ${category.is_active ? 'Active' : 'Inactive'}`);
        console.log(`   Featured: ${category.is_featured ? 'Yes' : 'No'}`);
        console.log('');
      });
      
    } else {
      console.log(`❌ Error: ${response.status} ${response.statusText}`);
    }
    
    // Test the dealer-specific endpoint for comparison
    console.log('\nTesting GET /api/categories?dealer_id=7');
    const response2 = await fetch('http://localhost:3002/api/categories?dealer_id=7');
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log(`✅ Success! Found ${data2.categories.length} categories for dealer 7`);
    } else {
      console.log(`❌ Error: ${response2.status} ${response2.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAllCategoriesAPI(); 