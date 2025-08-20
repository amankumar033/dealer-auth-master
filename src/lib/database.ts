import mysql from 'mysql2/promise';
import { createQueryCache } from './validation';

// Enhanced database configuration with connection pooling
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kriptocar',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  
  // Connection pool configuration
  connectionLimit: 5,
  
  // Connection settings
  waitForConnections: true,
  queueLimit: 0,
  
  // MySQL specific settings
  multipleStatements: false,
  dateStrings: false,
  
  // Connection timeout
  acquireTimeout: 30000,
  
  // SSL configuration (if needed)
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : undefined
};

// Create connection pool with enhanced error handling
let pool: mysql.Pool;

function createPool() {
  try {
    console.log('🔌 Creating database connection pool...');
    pool = mysql.createPool(dbConfig);
    
    // Note: MySQL2 pool doesn't support 'error' event in the same way as mysql
    // Error handling is done at the connection level
    
    console.log('✅ Database connection pool created successfully');
    return pool;
  } catch (error) {
    console.error('❌ Failed to create database pool:', error);
    throw error;
  }
}

// Initialize pool
createPool();

// Connection health check
async function checkConnectionHealth(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Connection health check failed:', error);
    return false;
  }
}

// Enhanced query execution with robust error handling and retry logic
export async function executeQuery(
  query: string, 
  params: any[] = [], 
  maxRetries = 3, 
  useCache = false,
  retryDelay = 1000
) {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Executing query (attempt ${attempt}/${maxRetries})`);
      
      // Backoff between retries without opening extra connections
      if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
      
      const startTime = Date.now();
      const connection = await pool.getConnection();
      
      // Apply session-level optimizations to prevent sort memory issues
      try {
        await connection.execute('SET SESSION sort_buffer_size = 2097152'); // 2MB
        await connection.execute('SET SESSION join_buffer_size = 1048576'); // 1MB
        await connection.execute('SET SESSION read_buffer_size = 1048576'); // 1MB
        await connection.execute('SET SESSION read_rnd_buffer_size = 2097152'); // 2MB
        await connection.execute("SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'");
      } catch (optimizationError) {
        console.warn('⚠️ Could not apply session optimizations:', (optimizationError as any)?.message || optimizationError);
      }

      try {
        const [rows] = await connection.execute(query, params);
      const queryTime = Date.now() - startTime;
      
      // Log slow queries
      if (queryTime > 1000) {
        console.warn(`🐌 Slow query detected (${queryTime}ms):`, query.substring(0, 100) + '...');
      }
      
        console.log(`✅ Query executed successfully in ${queryTime}ms`);
        return rows;
      } finally {
        connection.release();
      }
      
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Query execution failed (attempt ${attempt}/${maxRetries}):`, {
        error: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState
      });
      
      // Determine if we should retry based on error type
      const isRetryableError = isRetryableDatabaseError(error);
      
      if (isRetryableError && attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`🔄 Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // For connection errors, try to recreate the pool via auto-reconnect mechanism only
        if (isConnectionError(error)) {
          console.log('🔄 Connection error detected; relying on auto-reconnect.');
        }
      } else {
        break; // Don't retry non-retryable errors or if max retries reached
      }
    }
  }
  
  // If we get here, all retries failed
  console.error('❌ All query retries failed');
  throw new Error(`Database query failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Enhanced transaction execution
export async function executeTransaction(
  queries: { query: string; params: any[] }[], 
  maxRetries = 3
) {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let connection;
    
    try {
      console.log(`🔍 Executing transaction (attempt ${attempt}/${maxRetries})`);
      
      // Check connection health before starting transaction
      if (attempt > 1) {
        const isHealthy = await checkConnectionHealth();
        if (!isHealthy) {
          console.log('⚠️ Connection unhealthy, waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        }
      }
      
      connection = await pool.getConnection();
      await connection.beginTransaction();
      
      const results = [];
      for (const { query, params } of queries) {
        const [result] = await connection.execute(query, params);
        results.push(result);
      }
      
      await connection.commit();
      connection.release();
      
      console.log('✅ Transaction executed successfully');
      return results;
      
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Transaction failed (attempt ${attempt}/${maxRetries}):`, {
        error: error.message,
        code: error.code,
        errno: error.errno
      });
      
      // Rollback if we have a connection
      if (connection) {
        try {
          await connection.rollback();
          connection.release();
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError);
        }
      }
      
      // Determine if we should retry
      const isRetryableError = isRetryableDatabaseError(error);
      
      if (isRetryableError && attempt < maxRetries) {
        const delay = 2000 * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`🔄 Retrying transaction in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // For connection errors, try to recreate the pool
        if (isConnectionError(error)) {
          console.log('🔄 Attempting to recreate connection pool...');
          try {
            await pool.end();
            createPool();
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (poolError) {
            console.error('❌ Failed to recreate pool:', poolError);
          }
        }
      } else {
        break;
      }
    }
  }
  
  console.error('❌ All transaction retries failed');
  throw new Error(`Database transaction failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Helper function to determine if an error is retryable
function isRetryableDatabaseError(error: any): boolean {
  const retryableCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ER_ACCESS_DENIED_ERROR',
    'ER_MALFORMED_PACKET',
    'PROTOCOL_CONNECTION_LOST',
    'ER_SERVER_SHUTDOWN',
    'ER_QUERY_INTERRUPTED',
    'ER_LOCK_WAIT_TIMEOUT',
    'ER_LOCK_DEADLOCK',
    'ER_TOO_MANY_CONNECTIONS',
    'ER_CON_COUNT_ERROR',
    'ER_CONNECTION_KILLED'
  ];
  
  return retryableCodes.includes(error.code) || 
         retryableCodes.includes(error.errno?.toString()) ||
         error.message?.toLowerCase?.().includes('connection') ||
         error.message?.toLowerCase?.().includes('timeout') ||
         error.message?.toLowerCase?.().includes('too many connections') ||
         error.message?.includes('Malformed communication packet');
}

// Helper function to determine if an error is a connection error
function isConnectionError(error: any): boolean {
  const connectionCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'PROTOCOL_CONNECTION_LOST',
    'ER_SERVER_SHUTDOWN',
    'ER_CONNECTION_KILLED'
  ];
  
  return connectionCodes.includes(error.code) || 
         connectionCodes.includes(error.errno?.toString());
}

// Enhanced database health check
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'warning' | 'unhealthy';
  details: any;
}> {
  try {
    console.log('🔍 Checking database health...');
    
    // Test basic connectivity
    const connection = await pool.getConnection();
    await connection.ping();
    
    // Test query execution
    const [result] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
    
    // Get pool status
    const poolStatus = {
      totalConnections: pool.pool.config.connectionLimit,
      activeConnections: 0, // Not available in this version
      idleConnections: 0, // Not available in this version
      waitingConnections: 0 // Not available in this version
    };
    
    // Test table structure
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('categories', 'products', 'dealers', 'orders')
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `, [dbConfig.database]);
    
      connection.release();
    
    const healthDetails = {
      connection: 'OK',
      queryExecution: 'OK',
      poolStatus,
      tables: Array.isArray(tables) ? tables.length : 0,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Database health check passed');
    return {
      status: 'healthy',
      details: healthDetails
    };
    
  } catch (error: any) {
    console.error('❌ Database health check failed:', error);
    
    const healthDetails = {
      error: error.message,
      code: error.code,
      errno: error.errno,
      timestamp: new Date().toISOString()
    };
    
    // Determine status based on error type
    let status: 'healthy' | 'warning' | 'unhealthy' = 'unhealthy';
    
    if (isRetryableDatabaseError(error)) {
      status = 'warning'; // Temporary issue
    }
    
    return {
      status,
      details: healthDetails
    };
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    console.log('🔌 Closing database connection pool...');
    await pool.end();
    console.log('✅ Database connection pool closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

// Auto-reconnect mechanism
let reconnectInterval: NodeJS.Timeout | null = null;
let isReconnecting: boolean = false;
let lastReconnectAt = 0;

export function startAutoReconnect(intervalMs = 30000): void {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
  }
  
  reconnectInterval = setInterval(async () => {
    try {
      const isHealthy = await checkConnectionHealth();
      if (!isHealthy) {
        const now = Date.now();
        if (isReconnecting || now - lastReconnectAt < 10000) {
          // Skip if already reconnecting or too soon
          return;
        }
        isReconnecting = true;
        lastReconnectAt = now;

        console.log('🔄 Auto-reconnect: Connection unhealthy, attempting to reconnect...');
        try {
          // Create a new pool first, then swap and close the old pool
          const oldPool = pool;
          createPool();
          try {
            await oldPool.end();
          } catch (closeErr) {
            console.warn('⚠️ Auto-reconnect: Error closing old pool (ignored):', (closeErr as any)?.message || closeErr);
          }
          console.log('✅ Auto-reconnect: Successfully reconnected');
        } catch (error) {
          console.error('❌ Auto-reconnect: Failed to reconnect:', error);
        } finally {
          isReconnecting = false;
        }
      }
    } catch (error) {
      console.error('❌ Auto-reconnect: Health check failed:', error);
    }
  }, intervalMs);
  
  console.log(`🔄 Auto-reconnect started (interval: ${intervalMs}ms)`);
}

export function stopAutoReconnect(): void {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
    console.log('🔄 Auto-reconnect stopped');
  }
}

// Start auto-reconnect when module loads
startAutoReconnect();

// Handle process termination
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  stopAutoReconnect();
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  stopAutoReconnect();
  await closeDatabaseConnection();
  process.exit(0);
});

// Export the pool for direct access if needed
export { pool };

// Helper function to generate slug from name
async function generateSlug(name: string): Promise<string> {
  // Convert to lowercase and replace spaces with hyphens
  const baseSlug = name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove all non-alphanumeric characters except hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
  
  // Check if the base slug already exists
  const existingSlugs = await executeQuery(
    'SELECT slug FROM products WHERE slug LIKE ? ORDER BY slug',
    [`${baseSlug}%`]
  ) as any[];
  
  if (existingSlugs.length === 0) {
    return baseSlug;
  }
  
  // Find the highest number suffix
  let maxNumber = 0;
  existingSlugs.forEach((row: any) => {
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

// Enhanced ID generation with better error handling and uniqueness
async function generateProductId(dealerId: string): Promise<string> {
  const connection = await pool.getConnection();
  
  try {
    // Start transaction for atomic operations
    await connection.beginTransaction();
    
    console.log(`🔧 Generating product ID for dealer: ${dealerId}`);
    
    // Extract dealer number from dealer ID (e.g., DLR001 -> 001)
    const dealerNumberMatch = dealerId.match(/DLR(\d+)/);
    if (!dealerNumberMatch) {
      throw new Error(`Invalid dealer ID format: ${dealerId}. Expected format: DLR001`);
    }
    
    const dealerNumber = dealerNumberMatch[1];
    console.log(`📋 Dealer number extracted: ${dealerNumber}`);
    
    // Check if dealer exists
    const [dealerCheck] = await connection.execute(
      'SELECT dealer_id FROM dealers WHERE dealer_id = ?',
      [dealerId]
    );
    
    if ((dealerCheck as any[]).length === 0) {
      throw new Error(`Dealer ${dealerId} does not exist`);
    }
    
    // Get existing product IDs for this dealer
    const [existingProducts] = await connection.execute(
      'SELECT product_id FROM products WHERE dealer_id = ? ORDER BY product_id',
      [dealerId]
    );
    
    const existingProductIds = (existingProducts as any[]).map(row => row.product_id);
    console.log(`📦 Found ${existingProductIds.length} existing products for dealer ${dealerId}`);
    
    // Find the first available sequence number
    let sequenceNumber = 1;
    const maxAttempts = 1000; // Prevent infinite loops
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const candidateProductId = `PRO${dealerNumber}${sequenceNumber}`;
      
      // Check if this product ID already exists
      const [existingCheck] = await connection.execute(
        'SELECT product_id FROM products WHERE product_id = ?',
        [candidateProductId]
      );
      
      if ((existingCheck as any[]).length === 0) {
        // This product ID is available
        console.log(`✅ Found available product ID: ${candidateProductId}`);
        
        // Double-check with a lock to prevent race conditions
        const [finalCheck] = await connection.execute(
          'SELECT product_id FROM products WHERE product_id = ? FOR UPDATE',
          [candidateProductId]
        );
        
        if ((finalCheck as any[]).length === 0) {
          // Commit transaction and return the product ID
          await connection.commit();
          console.log(`🎉 Successfully generated product ID: ${candidateProductId}`);
          return candidateProductId;
        }
      }
      
      sequenceNumber++;
      attempts++;
    }
    
    // If we reach here, we couldn't find an available ID
    throw new Error(`Could not generate unique product ID for dealer ${dealerId} after ${maxAttempts} attempts`);
    
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    console.error('❌ Error generating product ID:', error);
    throw error;
  } finally {
    // Release connection
    connection.release();
  }
}

async function generateCategoryId(): Promise<string> {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    const count = (rows as any)[0].count;
    const timestamp = Date.now().toString().slice(-6);
    return `CTR${count + 1}_${timestamp}`;
  } catch (error) {
    console.error('Error generating category ID:', error);
    // Fallback: use timestamp
    return `CTR${Date.now()}`;
  }
}

async function generateSubCategoryId(): Promise<string> {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM sub_categories');
    const count = (rows as any)[0].count;
    const timestamp = Date.now().toString().slice(-6);
    return `SCTR${count + 1}_${timestamp}`;
  } catch (error) {
    console.error('Error generating sub-category ID:', error);
    // Fallback: use timestamp
    return `SCTR${Date.now()}`;
  }
}

async function generateOrderId(): Promise<string> {
  try {
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    const count = (rows as any)[0].count;
    const timestamp = Date.now().toString().slice(-6);
    return `ORD${count + 1}_${timestamp}`;
  } catch (error) {
    console.error('Error generating order ID:', error);
    // Fallback: use timestamp
    return `ORD${Date.now()}`;
  }
}

// Export the ID generation functions
export { generateProductId, generateCategoryId, generateSubCategoryId, generateOrderId, generateSlug };



// Clear cache function
export function clearQueryCache(): void {
  console.log('🗑️ Query cache cleared');
}

// Example queries for your database schema
export const queries = {
  // Category queries
  getCategories: `
    SELECT c.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone
    FROM categories c 
    LEFT JOIN dealers d ON c.dealer_id = d.dealer_id
    WHERE c.dealer_id = ? AND c.is_active = 1 
    ORDER BY c.name
  `,
  getCategoriesByDealer: `
    SELECT c.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone
    FROM categories c 
    LEFT JOIN dealers d ON c.dealer_id = d.dealer_id
    WHERE c.dealer_id = ? AND c.is_active = 1 
    ORDER BY c.name
  `,
  getAllCategories: `
    SELECT c.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone
    FROM categories c 
    LEFT JOIN dealers d ON c.dealer_id = d.dealer_id
    WHERE c.is_active = 1 
    ORDER BY c.name
  `,
  getCategoryById: `
    SELECT c.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone
    FROM categories c 
    LEFT JOIN dealers d ON c.dealer_id = d.dealer_id
    WHERE c.category_id = ? AND c.dealer_id = ?
  `,
  getCategoryByIdOnly: `
    SELECT c.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone
    FROM categories c 
    LEFT JOIN dealers d ON c.dealer_id = d.dealer_id
    WHERE c.category_id = ?
  `,
  createCategory: `
    INSERT INTO categories (category_id, dealer_id, name, description, is_active, is_featured, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `,
  updateCategory: `
    UPDATE categories 
    SET name = ?, description = ?, is_active = ?, is_featured = ?, updated_at = NOW()
    WHERE category_id = ? AND dealer_id = ?
  `,
  updateCategoryDisassociate: `
    UPDATE categories 
    SET dealer_id = NULL, id = ?, updated_at = NOW()
    WHERE category_id = ?
  `,
  deleteCategory: 'DELETE FROM categories WHERE category_id = ? AND dealer_id = ?',
  
  // Product queries
  getProducts: `
    SELECT p.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone,
           c.name as category_name, sc.name as sub_category_name
    FROM products p 
    LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN sub_categories sc ON p.sub_category_id = sc.sub_category_id
    WHERE p.dealer_id = ? 
    ORDER BY p.updated_at DESC
  `,
  getProductsByCategory: `
    SELECT p.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone,
           c.name as category_name
    FROM products p 
    LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
    LEFT JOIN categories c ON p.category_id = c.category_id
    WHERE p.dealer_id = ? AND p.category_id = ? 
    ORDER BY p.updated_at DESC
  `,
  getAllProductsByCategory: `
    SELECT p.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone,
           c.name as category_name
    FROM products p 
    LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
    LEFT JOIN categories c ON p.category_id = c.category_id
    WHERE p.category_id = ? 
    ORDER BY p.updated_at DESC
  `,
  getProductById: `
    SELECT p.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone,
           c.name as category_name
    FROM products p 
    LEFT JOIN dealers d ON p.dealer_id = d.dealer_id
    LEFT JOIN categories c ON p.category_id = c.category_id
    WHERE p.product_id = ? AND p.dealer_id = ?
  `,
  createProduct: `
    INSERT INTO products (
      product_id, dealer_id, name, slug, description, short_description, sale_price, original_price, rating, 
      image_1, image_2, image_3, image_4, category_id, sub_category_id,
      brand_name, sub_brand_name, manufacture, stock_quantity, is_active, is_featured, is_hot_deal, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  updateProduct: `
    UPDATE products 
    SET name = ?, slug = ?, description = ?, short_description = ?, sale_price = ?, original_price = ?, rating = ?,
        image_1 = ?, image_2 = ?, image_3 = ?, image_4 = ?, category_id = ?, sub_category_id = ?, brand_name = ?, sub_brand_name = ?, manufacture = ?, stock_quantity = ?, 
        is_active = ?, is_featured = ?, is_hot_deal = ?, updated_at = NOW()
    WHERE product_id = ? AND dealer_id = ?
  `,
  deleteProduct: 'DELETE FROM products WHERE product_id = ? AND dealer_id = ?',
  
  // Cascading delete queries for orders
  deleteOrdersByProduct: 'DELETE FROM orders WHERE product_id = ? AND dealer_id = ?',
  deleteOrdersByCategory: `
    DELETE o FROM orders o 
    INNER JOIN products p ON o.product_id = p.product_id 
    WHERE p.category_id = ? AND o.dealer_id = ?
  `,
  deleteProductsByCategory: 'DELETE FROM products WHERE category_id = ? AND dealer_id = ?',
  

  
  // Order queries - Updated to support both dealer_id and user_id
  getOrders: `
    SELECT o.*, o.qauntity as quantity, d.business_name, d.name as dealer_name, d.phone as dealer_phone, 
           d.business_address as dealer_address, d.pincode as dealer_pincode,
           p.name as product_name, p.image_1 as product_image, p.description as product_description, 
           p.sale_price as product_price, p.brand_name, p.sub_brand_name
    FROM orders o 
    LEFT JOIN dealers d ON o.dealer_id = d.dealer_id
    LEFT JOIN products p ON o.product_id = p.product_id
    WHERE o.dealer_id = ? OR o.user_id = ?
    ORDER BY o.order_date DESC
  `,
  getOrderById: `
    SELECT o.*, o.qauntity as quantity, d.business_name, d.name as dealer_name, d.phone as dealer_phone, 
           d.business_address as dealer_address, d.pincode as dealer_pincode,
           p.name as product_name, p.image_1 as product_image, p.description as product_description, 
           p.sale_price as product_price, p.brand_name, p.sub_brand_name
    FROM orders o 
    LEFT JOIN dealers d ON o.dealer_id = d.dealer_id
    LEFT JOIN products p ON o.product_id = p.product_id
    WHERE o.order_id = ? AND (o.dealer_id = ? OR o.user_id = ?)
  `,
  getOrdersByStatus: `
    SELECT o.*, o.qauntity as quantity, d.business_name, d.name as dealer_name, d.phone as dealer_phone, 
           d.business_address as dealer_address, d.pincode as dealer_pincode,
           p.name as product_name, p.image_1 as product_image, p.description as product_description, 
           p.sale_price as product_price, p.brand_name, p.sub_brand_name
    FROM orders o 
    LEFT JOIN dealers d ON o.dealer_id = d.dealer_id
    LEFT JOIN products p ON o.product_id = p.product_id
    WHERE (o.dealer_id = ? OR o.user_id = ?) AND o.order_status = ? 
    ORDER BY o.order_date DESC
  `,
  createOrder: `
    INSERT INTO orders (
      order_id, user_id, dealer_id, product_id, qauntity, customer_name, customer_email, customer_phone, 
      shipping_address, shipping_pincode, order_date, order_status, total_amount, 
      tax_amount, shipping_cost, discount_amount, payment_method, payment_status, transaction_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Pending', ?, ?, ?, ?, ?, 'Pending', ?)
  `,
  updateOrder: `
    UPDATE orders 
    SET order_status = ?, payment_status = ?
    WHERE order_id = ? AND dealer_id = ?
  `,
  deleteOrder: 'DELETE FROM orders WHERE order_id = ? AND dealer_id = ?',
  
  // Note: ServiceOrder and order_items tables removed as per user requirements
  // Only using: orders, products, categories, dealers tables
  
  // Dealer queries
  getDealerById: 'SELECT * FROM dealers WHERE dealer_id = ?',
  getDealerByEmail: 'SELECT * FROM dealers WHERE email = ?',
  updateDealer: `
    UPDATE dealers 
    SET business_name = ?, name = ?, email = ?, phone = ?, business_address = ?,
        pincode = ?, tax_id = ?, is_verified = ?, rating = ?, updated_at = NOW()
    WHERE dealer_id = ?
  `,
  updateDealerPassword: `
    UPDATE dealers 
    SET password_hash = ?, updated_at = NOW()
    WHERE dealer_id = ?
  `,
}; 