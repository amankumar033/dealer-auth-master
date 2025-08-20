import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET() {
  try {
    // Test notifications table
    const notifications = await executeQuery(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5'
    ) as any[];

    return NextResponse.json({ 
      success: true,
      count: notifications.length,
      notifications: notifications
    });
  } catch (error) {
    console.error('Error testing notifications:', error);
    return NextResponse.json({ error: 'Failed to test notifications' }, { status: 500 });
  }
} 