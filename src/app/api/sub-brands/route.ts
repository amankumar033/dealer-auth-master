import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandName = searchParams.get('brand_name');
    
    console.log('🔍 Sub-Brands API GET request');
    console.log('  - brand_name:', brandName);
    
    let query = 'SELECT * FROM sub_brands ORDER BY sub_brand_name';
    let params: any[] = [];
    
    if (brandName) {
      // Get sub-brands for a specific brand
      query = 'SELECT * FROM sub_brands WHERE brand_name = ? ORDER BY sub_brand_name';
      params = [brandName];
    }
    
    const subBrands = await executeQuery(query, params, 2, false) as any[];
    
    console.log('  - Found sub-brands:', subBrands?.length || 0);
    
    return NextResponse.json(subBrands || []);
    
  } catch (error) {
    console.error('Sub-Brands API error:', error);
    return NextResponse.json({ error: 'Failed to fetch sub-brands' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sub_brand_name, brand_name } = body;
    
    console.log('🔍 Sub-Brands API POST request');
    console.log('  - sub_brand_name:', sub_brand_name);
    console.log('  - brand_name:', brand_name);
    
    if (!sub_brand_name) {
      return NextResponse.json({ error: 'sub_brand_name is required' }, { status: 400 });
    }
    
    if (!brand_name) {
      return NextResponse.json({ error: 'brand_name is required' }, { status: 400 });
    }
    
    // Check if sub-brand already exists
    const existingSubBrands = await executeQuery(
      'SELECT * FROM sub_brands WHERE sub_brand_name = ?',
      [sub_brand_name],
      2,
      false
    );
    
    if (existingSubBrands && (existingSubBrands as any[]).length > 0) {
      return NextResponse.json({ error: 'Sub-brand already exists' }, { status: 409 });
    }
    
    // Check if brand exists
    const existingBrands = await executeQuery(
      'SELECT * FROM brands WHERE brand_name = ?',
      [brand_name],
      2,
      false
    );
    
    if (!existingBrands || (existingBrands as any[]).length === 0) {
      return NextResponse.json({ error: 'Brand does not exist' }, { status: 400 });
    }
    
    // Insert new sub-brand - created_at and updated_at will be auto-generated
    await executeQuery(
      'INSERT INTO sub_brands (sub_brand_name, brand_name) VALUES (?, ?)',
      [sub_brand_name, brand_name]
    );
    
    // Get the created sub-brand
    const createdRows = await executeQuery(
      'SELECT * FROM sub_brands WHERE sub_brand_name = ?',
      [sub_brand_name],
      2,
      false
    ) as any[];
    
    const newSubBrand = createdRows[0];
    
    console.log('  - Sub-brand created successfully:', newSubBrand);
    
    return NextResponse.json({ success: true, id: newSubBrand?.sub_brand_name || sub_brand_name });
    
  } catch (error: any) {
    // Handle duplicate entry race condition
    if (error?.message && error.message.includes('Duplicate entry')) {
      return NextResponse.json({ error: 'Sub-brand already exists' }, { status: 409 });
    }

    console.error('Sub-Brands API POST error:', error);
    return NextResponse.json({ error: 'Failed to create sub-brand' }, { status: 500 });
  }
}


