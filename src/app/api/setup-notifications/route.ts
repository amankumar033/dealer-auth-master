import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET() {
  try {
    // Check if notifications table exists
    const tableExists = await executeQuery(
      "SHOW TABLES LIKE 'notifications'"
    ) as any[];

    if (tableExists.length === 0) {
      return NextResponse.json({ 
        message: 'Notifications table does not exist',
        needsSetup: true 
      });
    }

    return NextResponse.json({ 
      message: 'Notifications table exists',
      needsSetup: false 
    });
  } catch (error) {
    console.error('Error checking notifications table:', error);
    return NextResponse.json({ error: 'Failed to check notifications table' }, { status: 500 });
  }
} 