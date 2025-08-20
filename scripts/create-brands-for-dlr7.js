const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: '82.29.162.35',
  user: 'kriptocar',
  password: 'kriptocar',
  database: 'kriptocar',
  port: 3306,
};

async function createBrandsForDLR7() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Create brands for DLR7
    console.log('\n🏷️ Creating brands for DLR7...');
    
    const brands = [
      { brand_name: 'DLR7Brand' },
      { brand_name: 'TestBrand' }
    ];

    for (const brand of brands) {
      try {
        await connection.execute(`
          INSERT INTO brands (brand_name, created_at, updated_at)
          VALUES (?, NOW(), NOW())
        `, [brand.brand_name]);
        console.log(`✅ Created brand: ${brand.brand_name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Brand ${brand.brand_name} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Create sub-brands
    console.log('\n🏷️ Creating sub-brands for DLR7...');
    
    const subBrands = [
      { sub_brand_name: 'Premium', brand_name: 'DLR7Brand' },
      { sub_brand_name: 'Performance', brand_name: 'DLR7Brand' },
      { sub_brand_name: 'Standard', brand_name: 'DLR7Brand' }
    ];

    for (const subBrand of subBrands) {
      try {
        await connection.execute(`
          INSERT INTO sub_brands (sub_brand_name, brand_name, created_at, updated_at)
          VALUES (?, ?, NOW(), NOW())
        `, [subBrand.sub_brand_name, subBrand.brand_name]);
        console.log(`✅ Created sub-brand: ${subBrand.sub_brand_name} (${subBrand.brand_name})`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Sub-brand ${subBrand.sub_brand_name} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    // Verify the brands were created
    console.log('\n🔍 Verifying created brands...');
    const [brandsList] = await connection.execute('SELECT brand_name FROM brands');
    console.log(`Total brands in database: ${brandsList.length}`);
    brandsList.forEach(brand => {
      console.log(`  - ${brand.brand_name}`);
    });

    const [subBrandsList] = await connection.execute('SELECT sub_brand_name, brand_name FROM sub_brands');
    console.log(`\nTotal sub-brands in database: ${subBrandsList.length}`);
    subBrandsList.forEach(subBrand => {
      console.log(`  - ${subBrand.sub_brand_name} (${subBrand.brand_name})`);
    });

    console.log('\n🎉 Brand creation completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
createBrandsForDLR7()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });













