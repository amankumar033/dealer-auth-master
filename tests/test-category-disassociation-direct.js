const fetch = require('node-fetch');

async function testCategoryDisassociation() {
  try {
    console.log('🧪 Testing Category Disassociation Directly...');
    
    // Test data - replace with actual values from your database
    const categoryId = 'CTR11'; // Replace with actual category ID
    const dealerId = 'DLR7';   // Replace with actual dealer ID
    
    console.log(`Testing with category_id: ${categoryId}, dealer_id: ${dealerId}`);
    
    // Step 1: Check current category state
    console.log('\n📋 Step 1: Checking current category state...');
    const getResponse = await fetch(`http://localhost:3000/api/categories/${categoryId}?dealer_id=${dealerId}`);
    console.log('GET Response status:', getResponse.status);
    
    if (getResponse.ok) {
      const categoryData = await getResponse.json();
      console.log('Current category data:', {
        category_id: categoryData.category?.category_id,
        name: categoryData.category?.name,
        dealer_id: categoryData.category?.dealer_id,
        id: categoryData.category?.id
      });
    } else {
      console.log('GET Response error:', await getResponse.text());
    }
    
    // Step 2: Test the disassociation
    console.log('\n🔄 Step 2: Testing category disassociation...');
    const putResponse = await fetch(`http://localhost:3000/api/categories/${categoryId}?dealer_id=${dealerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dealer_id: null,
        id: 1
      })
    });
    
    console.log('PUT Response status:', putResponse.status);
    console.log('PUT Response headers:', Object.fromEntries(putResponse.headers.entries()));
    
    const putResponseText = await putResponse.text();
    console.log('PUT Response body:', putResponseText);
    
    if (putResponse.ok) {
      console.log('✅ Disassociation API call successful!');
      try {
        const putResponseData = JSON.parse(putResponseText);
        console.log('Updated category data:', {
          category_id: putResponseData.category?.category_id,
          name: putResponseData.category?.name,
          dealer_id: putResponseData.category?.dealer_id,
          id: putResponseData.category?.id
        });
      } catch (e) {
        console.log('Response is not JSON:', putResponseText);
      }
    } else {
      console.log('❌ Disassociation API call failed!');
    }
    
    // Step 3: Verify the changes
    console.log('\n🔍 Step 3: Verifying changes...');
    const verifyResponse = await fetch(`http://localhost:3000/api/categories/${categoryId}?dealer_id=${dealerId}`);
    console.log('Verify Response status:', verifyResponse.status);
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('Final category data:', {
        category_id: verifyData.category?.category_id,
        name: verifyData.category?.name,
        dealer_id: verifyData.category?.dealer_id,
        id: verifyData.category?.id
      });
      
      // Check if disassociation was successful
      if (verifyData.category?.dealer_id === null && verifyData.category?.id === 1) {
        console.log('🎉 SUCCESS: Category disassociation worked correctly!');
        console.log('  - dealer_id is now null');
        console.log('  - id is now 1');
      } else {
        console.log('❌ FAILED: Category disassociation did not work as expected');
        console.log(`  - Expected: dealer_id = null, id = 1`);
        console.log(`  - Actual: dealer_id = ${verifyData.category?.dealer_id}, id = ${verifyData.category?.id}`);
      }
    } else {
      console.log('Verify Response error:', await verifyResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testCategoryDisassociation().catch(console.error); 