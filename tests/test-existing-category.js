const fetch = require('node-fetch');

async function testExistingCategory() {
  try {
    console.log('🧪 Testing disassociation with existing category...');
    
    // Use an existing category from your database
    const categoryId = 'CTR5'; // Suspension category
    const dealerId = 'DLR7';
    
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
      return;
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
        
        if (putResponseData.category?.dealer_id === null && putResponseData.category?.id === 1) {
          console.log('🎉 SUCCESS: dealer_id is null and id is 1!');
        } else {
          console.log('❌ FAILED: Values not updated correctly');
          console.log(`Expected: dealer_id = null, id = 1`);
          console.log(`Actual: dealer_id = ${putResponseData.category?.dealer_id}, id = ${putResponseData.category?.id}`);
        }
      } catch (e) {
        console.log('Response is not JSON:', putResponseText);
      }
    } else {
      console.log('❌ Disassociation API call failed!');
    }
    
    // Step 3: Verify the changes
    console.log('\n🔍 Step 3: Verifying changes...');
    // After disassociation, the category no longer belongs to the dealer, so we need to use show_all=true
    const verifyResponse = await fetch(`http://localhost:3000/api/categories?show_all=true`);
    console.log('Verify Response status:', verifyResponse.status);
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      
      // Find the specific category in the list
      const disassociatedCategory = verifyData.categories?.find(cat => cat.category_id === categoryId);
      
      if (disassociatedCategory) {
        console.log('Final category data:', {
          category_id: disassociatedCategory.category_id,
          name: disassociatedCategory.name,
          dealer_id: disassociatedCategory.dealer_id,
          id: disassociatedCategory.id
        });
        
        // Check if disassociation was successful
        if (disassociatedCategory.dealer_id === null && disassociatedCategory.id === 1) {
          console.log('🎉 SUCCESS: Category disassociation worked correctly!');
          console.log('  - dealer_id is now null');
          console.log('  - id is now 1');
        } else {
          console.log('❌ FAILED: Category disassociation did not work as expected');
          console.log(`  - Expected: dealer_id = null, id = 1`);
          console.log(`  - Actual: dealer_id = ${disassociatedCategory.dealer_id}, id = ${disassociatedCategory.id}`);
        }
      } else {
        console.log('❌ Category not found in verification response');
      }
    } else {
      console.log('Verify Response error:', await verifyResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

testExistingCategory().catch(console.error); 