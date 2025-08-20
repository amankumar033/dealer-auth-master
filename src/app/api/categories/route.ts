import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, queries, generateCategoryId } from '@/lib/database';
import { 
  validateCategoryData, 
  formatErrorResponse 
} from '@/lib/validation';
import { getIndiaTimestamp } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealer_id');
    const showAll = searchParams.get('show_all') === 'true';
    const dealerProducts = searchParams.get('dealer_products') === 'true';
    
    console.log('Categories API: Received dealerId:', dealerId, 'showAll:', showAll, 'dealerProducts:', dealerProducts);
    
    // First, let's test if we can connect to the database
    try {
      const testQuery = await executeQuery('SELECT 1 as test', [], 2, true);
      console.log('Database connection test successful:', testQuery);
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      const errorResponse = formatErrorResponse(dbError, 'Categories GET API - Connection Test');
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
    // Test if categories table exists and check its structure
    try {
      const tableTest = await executeQuery(`
        SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories'
        ORDER BY ORDINAL_POSITION
      `, [process.env.DB_NAME || 'kriptocar'], 2, true);
      
      console.log('Categories table structure:', tableTest);
    } catch (tableError) {
      console.error('Table test failed:', tableError);
      const errorResponse = formatErrorResponse(tableError, 'Categories GET API - Table Test');
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
    let categories;
    
    if (dealerProducts && dealerId) {
      // Show categories where the dealer has created products
      console.log('Categories API: Fetching categories where dealer has products');
      try {
        const query = `
          SELECT DISTINCT c.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone,
                 (SELECT COUNT(*) FROM products p2 WHERE p2.category_id = c.category_id AND p2.dealer_id = ?) as total_products
          FROM categories c
          LEFT JOIN dealers d ON c.dealer_id = d.dealer_id
          INNER JOIN products p ON c.category_id = p.category_id
          WHERE p.dealer_id = ?
          ORDER BY c.updated_at DESC
        `;
        categories = await executeQuery(query, [dealerId, dealerId], 2, true) as any[];
        console.log('Categories API: dealerProducts query executed successfully');
      } catch (queryError) {
        console.error('Categories API: dealerProducts query failed:', queryError);
        const errorResponse = formatErrorResponse(queryError, 'Categories GET API - Dealer Products Query');
        return NextResponse.json(errorResponse, { status: 500 });
      }
    } else if (showAll) {
      // Show all categories from all dealers
      console.log('Categories API: Fetching all categories');
      try {
        categories = await executeQuery(queries.getAllCategories, [], 2, true) as any[];
        console.log('Categories API: getAllCategories query executed successfully');
      } catch (queryError) {
        console.error('Categories API: getAllCategories query failed:', queryError);
        const errorResponse = formatErrorResponse(queryError, 'Categories GET API - All Categories Query');
        return NextResponse.json(errorResponse, { status: 500 });
      }
    } else if (dealerId) {
      // Show categories for specific dealer
      console.log('Categories API: Executing query with dealer filter');
      try {
        categories = await executeQuery(queries.getCategories, [dealerId], 2, true) as any[];
        console.log('Categories API: getCategories query executed successfully');
      } catch (queryError) {
        console.error('Categories API: getCategories query failed:', queryError);
        const errorResponse = formatErrorResponse(queryError, 'Categories GET API - Dealer Categories Query');
        return NextResponse.json(errorResponse, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Either dealer_id, show_all=true, or dealer_products=true is required' }, { status: 400 });
    }
    
    console.log('Categories API: Query result:', categories);
    console.log('Categories API: Query result type:', typeof categories);
    console.log('Categories API: Query result length:', Array.isArray(categories) ? categories.length : 'Not an array');
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Database error:', error);
    console.error('Database error details:', error instanceof Error ? error.message : 'Unknown error');
    const errorResponse = formatErrorResponse(error, 'Categories GET API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Categories API POST: Received request body:', body);
    
    // Validate category data using comprehensive validation
    const validation = validateCategoryData(body);
    if (!validation.isValid) {
      console.error('Categories API POST: Validation failed:', validation.errors);
      return NextResponse.json({ 
        error: 'Invalid category data',
        details: validation.errors 
      }, { status: 400 });
    }
    
    const sanitizedData = validation.sanitizedData!;
    
    console.log('Categories API POST: Creating category with validated data:', sanitizedData);
    
    // Validate dealer_id exists in Dealers table
    try {
      const dealers = await executeQuery(queries.getDealerById, [sanitizedData.dealer_id], 2, true) as any[];
      if (!dealers || dealers.length === 0) {
        console.error('Categories API POST: Dealer not found:', sanitizedData.dealer_id);
        return NextResponse.json({ error: 'Invalid dealer_id: Dealer not found' }, { status: 400 });
      }
    } catch (dealerError) {
      console.error('Categories API POST: Error checking dealer:', dealerError);
      return NextResponse.json({ error: 'Failed to validate dealer' }, { status: 500 });
    }
    
    // Generate custom category ID
    let categoryId;
    try {
      categoryId = await generateCategoryId();
      console.log('Categories API POST: Generated category ID:', categoryId);
    } catch (idError) {
      console.error('Categories API POST: Error generating category ID:', idError);
      return NextResponse.json({ error: 'Failed to generate category ID' }, { status: 500 });
    }
    
    console.log('Categories API POST: Creating category with params:', [categoryId, sanitizedData.dealer_id, sanitizedData.name, sanitizedData.description, sanitizedData.is_active, sanitizedData.is_featured]);
    
    try {
      const result = await executeQuery(queries.createCategory, [
        categoryId, 
        sanitizedData.dealer_id,
        sanitizedData.name, 
        sanitizedData.description, 
        sanitizedData.is_active, 
        sanitizedData.is_featured
      ]);
      console.log('Categories API POST: Create result:', result);
    } catch (createError) {
      console.error('Categories API POST: Error creating category:', createError);
      return NextResponse.json({ error: 'Failed to create category in database' }, { status: 500 });
    }
    
    // Get the created category using the custom category ID
    try {
      const categories = await executeQuery('SELECT * FROM categories WHERE category_id = ?', [categoryId], 2, true) as any[];
      const newCategory = categories[0];
      console.log('Categories API POST: Retrieved new category:', newCategory);
      
      if (!newCategory) {
        console.error('Categories API POST: Category not found after creation');
        return NextResponse.json({ error: 'Category created but not found' }, { status: 500 });
      }

      // Create notification for category creation
      try {
        await createCategoryNotification(newCategory);
        console.log('Categories API POST: Category notification created successfully');
      } catch (notificationError) {
        console.error('Categories API POST: Failed to create category notification:', notificationError);
        // Don't fail the request if notification fails
      }
      
      return NextResponse.json({ category: newCategory }, { status: 201 });
    } catch (retrieveError) {
      console.error('Categories API POST: Error retrieving created category:', retrieveError);
      return NextResponse.json({ error: 'Category created but failed to retrieve' }, { status: 500 });
    }
  } catch (error) {
    console.error('Categories API POST: Unexpected error:', error);
    const errorResponse = formatErrorResponse(error, 'Categories POST API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Helper function to create category notification
async function createCategoryNotification(category: any) {
  try {
    const notificationData = {
      type: 'category_created',
      title: 'New Category Added',
      message: `Category "${category.name}" was created by dealer ${category.dealer_id}`,
      description: `A new category "${category.name}" has been successfully created by dealer ${category.dealer_id}. This category is now available in the system and can be used for organizing products. The category includes a detailed description and is set up for proper product categorization. Please review the category information and ensure it meets the business requirements.`,
      for_admin: 1,
      for_dealer: 0,
      for_user: 0,
      for_vendor: 0,
      product_id: null,
      dealer_id: category.dealer_id,
      metadata: JSON.stringify({
        category_id: category.category_id,
        category_name: category.name,
        dealer_id: category.dealer_id,
        description: category.description,
        is_active: category.is_active,
        is_featured: category.is_featured
      })
    };

    const indiaTime = getIndiaTimestamp();
    const result = await executeQuery(
      'INSERT INTO notifications (type, title, message, description, for_admin, for_dealer, for_user, for_vendor, product_id, dealer_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [notificationData.type, notificationData.title, notificationData.message, notificationData.description, notificationData.for_admin, notificationData.for_dealer, notificationData.for_user, notificationData.for_vendor, notificationData.product_id, notificationData.dealer_id, notificationData.metadata, indiaTime]
    );

    console.log('Category notification stored in database:', result);
  } catch (error) {
    console.error('Failed to create category notification:', error);
    throw error;
  }
} 