import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET() {
  try {
    const brands = await executeQuery('SELECT * FROM brands ORDER BY brand_name') as any[];
    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand_name } = body;
    
    console.log('🏷️ Brands API POST request');
    console.log('  - brand_name:', brand_name);
    
    if (!brand_name) {
      return NextResponse.json({ error: 'brand_name is required' }, { status: 400 });
    }

    // Check if brand already exists
    const existing = await executeQuery(
      'SELECT brand_name FROM brands WHERE brand_name = ?',
      [brand_name],
      2,
      false
    );
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ error: 'Brand already exists' }, { status: 409 });
    }

    // Create new brand - only brand_name, created_at and updated_at will be auto-generated
    await executeQuery(
      'INSERT INTO brands (brand_name) VALUES (?)',
      [brand_name],
      2,
      false
    );
    
    console.log('  - Brand created successfully');
    
    return NextResponse.json({ success: true, id: brand_name });
    
  } catch (error: any) {
    if (error?.message && error.message.includes('Duplicate entry')) {
      return NextResponse.json({ error: 'Brand already exists' }, { status: 409 });
    }
    console.error('Brands API POST error:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
