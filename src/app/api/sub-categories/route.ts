import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, generateSubCategoryId, generateSlug } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    
    console.log('🔍 Sub-Categories API GET request');
    console.log('  - categoryId:', categoryId);
    
    let query = 'SELECT * FROM sub_categories ORDER BY name';
    let params: any[] = [];
    
    if (categoryId) {
      // Get sub-categories for a specific category
      query = 'SELECT * FROM sub_categories WHERE category_id = ? ORDER BY name';
      params = [categoryId];
    }
    
    const subCategories = await executeQuery(query, params, 2, false) as any[];
    
    console.log('  - Found sub-categories:', subCategories?.length || 0);
    
    return NextResponse.json(subCategories || []);
    
  } catch (error) {
    console.error('Sub-Categories API error:', error);
    return NextResponse.json({ error: 'Failed to fetch sub-categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category_id } = body;
    
    console.log('🔍 Sub-Categories API POST request');
    console.log('  - name:', name);
    console.log('  - category_id:', category_id);
    
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    
    if (!category_id) {
      return NextResponse.json({ error: 'category_id is required' }, { status: 400 });
    }
    
    // Generate sub-category ID and slug
    const subCategoryId = await generateSubCategoryId();
    const slug = await generateSlug(name);
    
    console.log('  - Generated sub_category_id:', subCategoryId);
    console.log('  - Generated slug:', slug);
    
    // Insert sub-category
    await executeQuery(
      'INSERT INTO sub_categories (sub_category_id, name, slug, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [subCategoryId, name, slug, category_id]
    );
    
    // Get the created sub-category
    const subCategories = await executeQuery(
      'SELECT * FROM sub_categories WHERE sub_category_id = ?',
      [subCategoryId],
      2,
      false
    ) as any[];
    
    const newSubCategory = subCategories[0];
    
    console.log('  - Sub-category created successfully:', newSubCategory);
    
    return NextResponse.json({ subCategory: newSubCategory }, { status: 201 });
    
  } catch (error) {
    console.error('Sub-Categories API POST error:', error);
    return NextResponse.json({ error: 'Failed to create sub-category' }, { status: 500 });
  }
}

