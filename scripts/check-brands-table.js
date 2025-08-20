const mysql = require('mysql2/promise');

async function checkAndCreateBrandsTable() {
  let connection;
  try {
    // Create connection with explicit credentials
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'kriptocar',
      port: 3306
    });

    console.log('🔍 Checking if brands table exists...');

    // Check if brands table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'brands'"
    );

    if (tables.length === 0) {
      console.log('❌ Brands table does not exist. Creating it...');
      
      // Create brands table
      await connection.execute(`
        CREATE TABLE brands (
          brand_name VARCHAR(255) PRIMARY KEY,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Brands table created successfully');
    } else {
      console.log('✅ Brands table already exists');
    }

    // Check if sub_brands table exists
    const [subBrandsTables] = await connection.execute(
      "SHOW TABLES LIKE 'sub_brands'"
    );

    if (subBrandsTables.length === 0) {
      console.log('❌ Sub-brands table does not exist. Creating it...');
      
      // Create sub_brands table
      await connection.execute(`
        CREATE TABLE sub_brands (
          sub_brand_name VARCHAR(255) PRIMARY KEY,
          brand_name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (brand_name) REFERENCES brands(brand_name) ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      
      console.log('✅ Sub-brands table created successfully');
    } else {
      console.log('✅ Sub-brands table already exists');
    }

    // Insert some sample brands if table is empty
    const [brands] = await connection.execute('SELECT COUNT(*) as count FROM brands');
    if (brands[0].count === 0) {
      console.log('📝 Inserting sample brands...');
      
      const sampleBrands = [
        ['Autoliv', 'Automotive safety systems'],
        ['Bosch', 'Automotive technology and services'],
        ['Continental', 'Automotive parts and systems'],
        ['Delphi', 'Automotive technology'],
        ['Denso', 'Automotive components'],
        ['ZF', 'Automotive transmission and chassis technology'],
        ['Valeo', 'Automotive parts and systems'],
        ['Magna', 'Automotive parts and systems'],
        ['Aisin', 'Automotive parts and systems'],
        ['BorgWarner', 'Automotive transmission and engine components']
      ];

      for (const [brandName, description] of sampleBrands) {
        try {
          await connection.execute(
            'INSERT INTO brands (brand_name, description) VALUES (?, ?)',
            [brandName, description]
          );
          console.log(`✅ Added brand: ${brandName}`);
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.log(`⚠️ Brand already exists: ${brandName}`);
          } else {
            console.error(`❌ Error adding brand ${brandName}:`, error.message);
          }
        }
      }
    }

    console.log('✅ Database setup completed successfully');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAndCreateBrandsTable();
