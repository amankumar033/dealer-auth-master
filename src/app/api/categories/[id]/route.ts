import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, queries } from '@/lib/database';
import { 
  validateRequestParams, 
  validateUpdateData, 
  formatErrorResponse,
  sanitizeVarcharId 
} from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealer_id');
    
    // Validate request parameters
    const paramValidation = validateRequestParams(
      { dealer_id: dealerId }, 
      ['dealer_id']
    );
    
    if (!paramValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid parameters',
        details: paramValidation.errors 
      }, { status: 400 });
    }
    
    const { id } = await params;
    const sanitizedId = sanitizeVarcharId(id);
    const sanitizedDealerId = paramValidation.sanitizedData!.dealer_id;
    
    if (!sanitizedId) {
      return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 });
    }
    
    const categories = await executeQuery(queries.getCategoryById, [sanitizedId, sanitizedDealerId], 2, true) as any[];
    const category = categories[0];
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch (error) {
    console.error('Database error:', error);
    const errorResponse = formatErrorResponse(error, 'Category GET API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dealer_id = searchParams.get('dealer_id');
    
    // Validate request parameters
    const paramValidation = validateRequestParams(
      { dealer_id }, 
      ['dealer_id']
    );
    
    if (!paramValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid parameters',
        details: paramValidation.errors 
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { id } = await params;
    
    const sanitizedId = sanitizeVarcharId(id);
    const sanitizedDealerId = paramValidation.sanitizedData!.dealer_id;
    
    if (!sanitizedId) {
      return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 });
    }
    
    // Validate update data - allow dealer_id and id for special cases
    const allowedFields = ['name', 'description', 'is_active', 'is_featured', 'dealer_id', 'id'];
    // Note: dealer_id and id are allowed for category disassociation scenarios
    
    console.log('🔍 Debug: Request body:', body);
    console.log('🔍 Debug: Allowed fields:', allowedFields);
    
    const updateValidation = validateUpdateData(body, allowedFields);
    console.log('🔍 Debug: Validation result:', updateValidation);
    
    if (!updateValidation.isValid) {
      console.log('❌ Debug: Validation failed:', updateValidation.errors);
      return NextResponse.json({ 
        error: 'Invalid update data',
        details: updateValidation.errors 
      }, { status: 400 });
    }
    
    console.log('✅ Debug: Validation passed');
    
    // Check if category exists
    const existingCategories = await executeQuery(queries.getCategoryById, [sanitizedId, sanitizedDealerId], 2, true) as any[];
    if (!existingCategories || existingCategories.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const existingCategory = existingCategories[0];
    
    // Prepare update parameters with proper defaults
    const updateData = updateValidation.sanitizedData!;
    
    // Special handling for dealer_id disassociation
    console.log('🔍 Debug: Checking updateData.dealer_id:', updateData.dealer_id);
    console.log('🔍 Debug: updateData.dealer_id === null:', updateData.dealer_id === null);
    console.log('🔍 Debug: updateData.id:', updateData.id);
    
    if (updateData.dealer_id === null) {
      console.log('✅ Debug: Entering disassociation logic');
      try {
        // Use special query for disassociation
        const disassociateParams = [
          updateData.id ?? 1, // id
          sanitizedId // category_id
        ];
        
        console.log('Category disassociation parameters:', disassociateParams);
        console.log('Executing query:', queries.updateCategoryDisassociate);
        await executeQuery(queries.updateCategoryDisassociate, disassociateParams);
        console.log('✅ Debug: Disassociation query executed successfully');
      } catch (disassociateError) {
        console.error('Error during category disassociation:', disassociateError);
        throw new Error(`Failed to disassociate category: ${disassociateError instanceof Error ? disassociateError.message : 'Unknown error'}`);
      }
    } else {
      console.log('❌ Debug: Not entering disassociation logic, dealer_id is not null');
      try {
        // Regular update
        const updateParams = [
          updateData.name ?? existingCategory.name,
          updateData.description ?? existingCategory.description,
          updateData.is_active ?? existingCategory.is_active ?? true,
          updateData.is_featured ?? existingCategory.is_featured ?? false,
          sanitizedId,
          existingCategory.dealer_id
        ];
        
        console.log('Category update parameters:', updateParams);
        await executeQuery(queries.updateCategory, updateParams);
      } catch (updateError) {
        console.error('Error during category update:', updateError);
        throw new Error(`Failed to update category: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
      }
    }
    
    // Get updated category - use different query based on whether we disassociated
    let updatedCategories;
    try {
      if (updateData.dealer_id === null) {
        // After disassociation, use the query without dealer_id constraint
        console.log('🔍 Debug: Retrieving disassociated category with getCategoryByIdOnly');
        updatedCategories = await executeQuery(queries.getCategoryByIdOnly, [sanitizedId], 2, true) as any[];
        console.log('🔍 Debug: Disassociated category query result:', updatedCategories);
      } else {
        // Regular update, use the query with dealer_id constraint
        console.log('🔍 Debug: Retrieving regular category with getCategoryById');
        updatedCategories = await executeQuery(queries.getCategoryById, [sanitizedId, sanitizedDealerId], 2, true) as any[];
        console.log('🔍 Debug: Regular category query result:', updatedCategories);
      }
      const updatedCategory = updatedCategories[0];
      
      if (!updatedCategory) {
        throw new Error('Category not found after update');
      }
      
      console.log('🔍 Debug: Final updated category:', {
        category_id: updatedCategory.category_id,
        name: updatedCategory.name,
        dealer_id: updatedCategory.dealer_id,
        id: updatedCategory.id
      });
      
      return NextResponse.json({ category: updatedCategory });
    } catch (retrieveError) {
      console.error('Error retrieving updated category:', retrieveError);
      throw new Error(`Failed to retrieve updated category: ${retrieveError instanceof Error ? retrieveError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Database error:', error);
    const errorResponse = formatErrorResponse(error, 'Category PUT API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealer_id');
    
    // Validate request parameters
    const paramValidation = validateRequestParams(
      { dealer_id: dealerId }, 
      ['dealer_id']
    );
    
    if (!paramValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid parameters',
        details: paramValidation.errors 
      }, { status: 400 });
    }
    
    const { id } = await params;
    const sanitizedId = sanitizeVarcharId(id);
    const sanitizedDealerId = paramValidation.sanitizedData!.dealer_id;
    
    if (!sanitizedId) {
      return NextResponse.json({ error: 'Invalid category ID format' }, { status: 400 });
    }
    
    // Check if category exists
    const existingCategories = await executeQuery(queries.getCategoryById, [sanitizedId, sanitizedDealerId], 2, true) as any[];
    if (!existingCategories || existingCategories.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    // Delete related orders first (cascading delete)
    console.log('🗑️ Deleting related orders for category:', sanitizedId);
    await executeQuery(queries.deleteOrdersByCategory, [sanitizedId, sanitizedDealerId]);
    
    // Delete all products in this category (this will also delete their orders)
    console.log('🗑️ Deleting all products in category:', sanitizedId);
    await executeQuery(queries.deleteProductsByCategory, [sanitizedId, sanitizedDealerId]);
    
    // Delete category
    console.log('🗑️ Deleting category:', sanitizedId);
    await executeQuery(queries.deleteCategory, [sanitizedId, sanitizedDealerId]);
    
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    const errorResponse = formatErrorResponse(error, 'Category DELETE API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 