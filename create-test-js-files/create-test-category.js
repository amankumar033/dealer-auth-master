const fetch = require('node-fetch');

async function createAndTestCategory() {
  try {
    console.log('🧪 Creating test category and testing disassociation...');
    
    // Create a test category
    const createResponse = await fetch('http://localhost:3000/api/categories?dealer_id=DLR7', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dealer_id: 'DLR7',
        name: 'Test Category for Disassociation',
        description: 'This is a test category to verify disassociation works',
        is_active: true,
        is_featured: false
      })
    });
    
    console.log('Create Response status:', createResponse.status);
    
    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Category created successfully!');
      console.log('Created category:', {
        category_id: createResult.category?.category_id,
        name: createResult.category?.name,
        dealer_id: createResult.category?.dealer_id,
        id: createResult.category?.id
      });
      
      const categoryId = createResult.category.category_id;
      const dealerId = createResult.category.dealer_id;
      
      // Test disassociation
      console.log('\n🔄 Testing disassociation...');
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
      
      if (putResponse.ok) {
        const result = await putResponse.json();
        console.log('✅ Disassociation successful!');
        console.log('Updated category:', {
          category_id: result.category?.category_id,
          name: result.category?.name,
          dealer_id: result.category?.dealer_id,
          id: result.category?.id
        });
        
        if (result.category?.dealer_id === null && result.category?.id === 1) {
          console.log('🎉 SUCCESS: dealer_id is null and id is 1!');
          console.log('The disassociation functionality is working correctly!');
        } else {
          console.log('❌ FAILED: Values not updated correctly');
          console.log(`Expected: dealer_id = null, id = 1`);
          console.log(`Actual: dealer_id = ${result.category?.dealer_id}, id = ${result.category?.id}`);
        }
      } else {
        const errorText = await putResponse.text();
        console.log('❌ Disassociation failed:', errorText);
      }
      
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Category creation failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAndTestCategory().catch(console.error); 