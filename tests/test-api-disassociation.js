const fetch = require('node-fetch');

async function testCategoryDisassociationAPI() {
  try {
    console.log('🧪 Testing Category Disassociation API...');
    
    // Test data
    const categoryId = 'CTR5'; // Replace with an actual category ID from your database
    const dealerId = 'DLR7';   // Replace with an actual dealer ID
    
    console.log(`Testing with category_id: ${categoryId}, dealer_id: ${dealerId}`);
    
    // Test the disassociation API call
    const response = await fetch(`http://localhost:3000/api/categories/${categoryId}?dealer_id=${dealerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dealer_id: null,
        id: 1
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ API call successful!');
      try {
        const responseData = JSON.parse(responseText);
        console.log('Response data:', responseData);
      } catch (e) {
        console.log('Response is not JSON:', responseText);
      }
    } else {
      console.log('❌ API call failed!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testCategoryDisassociationAPI().catch(console.error); 