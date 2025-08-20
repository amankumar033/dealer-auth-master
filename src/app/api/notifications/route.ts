import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealer_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log('🔔 Notifications API GET request');
    console.log('  - dealerId:', dealerId);
    console.log('  - limit:', limit);
    console.log('  - offset:', offset);
    
    if (!dealerId) {
      return NextResponse.json({ error: 'dealer_id is required' }, { status: 400 });
    }

    try {
      // Query notifications with the correct table structure
      // Use simple query without LIMIT/OFFSET first to test
      const notifications = await executeQuery(
        `SELECT id, type, title, message, for_dealer, dealer_id, is_read, created_at, updated_at, metadata
         FROM notifications 
         WHERE dealer_id = ? AND for_dealer = 1 
         ORDER BY created_at DESC`, 
        [dealerId], 
        2, 
        false
      ) as any[];
      
      // Get total count for pagination
      const countResult = await executeQuery(
        'SELECT COUNT(*) as total FROM notifications WHERE dealer_id = ? AND for_dealer = 1',
        [dealerId],
        2,
        false
      );
      
      const total = (countResult as any[])?.[0]?.total || 0;
      
      // Apply pagination manually
      const paginatedNotifications = notifications ? notifications.slice(offset, offset + limit) : [];
      
      console.log('  - Found notifications:', notifications?.length || 0);
      console.log('  - Paginated notifications:', paginatedNotifications.length);
      console.log('  - Total notifications:', total);
      
      return NextResponse.json({
        notifications: paginatedNotifications,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
      
    } catch (dbError) {
      console.error('Database error in notifications API:', dbError);
      
      // If it's a table doesn't exist error, return empty array
      if (dbError instanceof Error && dbError.message && dbError.message.includes('doesn\'t exist')) {
        console.log('⚠️ Notifications table doesn\'t exist, returning empty array');
        return NextResponse.json({
          notifications: [],
          pagination: {
            total: 0,
            limit,
            offset,
            hasMore: false
          }
        });
      }
      
      // For other database errors, throw the error
      throw dbError;
    }
    
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, isRead, for_dealer } = body;
    
    console.log('🔔 Notifications API PUT request');
    console.log('  - notificationId:', notificationId);
    console.log('  - isRead:', isRead);
    console.log('  - for_dealer:', for_dealer);
    
    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
    }

    // Handle different update types
    if (for_dealer !== undefined) {
      // Remove notification (set for_dealer to 0)
      await executeQuery(
        'UPDATE notifications SET for_dealer = ? WHERE id = ?', 
        [for_dealer, notificationId], 
        2, 
        false
      );
      console.log('  - Notification removed successfully');
    } else if (isRead !== undefined) {
      // Update notification read status
      await executeQuery(
        'UPDATE notifications SET is_read = ? WHERE id = ?', 
        [isRead ? 1 : 0, notificationId], 
        2, 
        false
      );
      console.log('  - Notification read status updated successfully');
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Notifications API PUT error:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId } = body;
    
    console.log('🔔 Notifications API DELETE request');
    console.log('  - notificationId:', notificationId);
    
    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId is required' }, { status: 400 });
    }

    // Delete notification from database
    await executeQuery(
      'DELETE FROM notifications WHERE id = ?', 
      [notificationId], 
      2, 
      false
    );
    
    console.log('  - Notification deleted successfully');
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Notifications API DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
} 