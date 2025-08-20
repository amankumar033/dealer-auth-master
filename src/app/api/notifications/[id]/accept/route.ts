import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { emailService } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notificationId = id;
    const body = await request.json();
    const dealer_id = body?.dealer_id;
    const singleOrderIdFromBody = body?.order_id || body?.orderId;

    console.log('🔔 Accept Order via Notification API');
    console.log('  - notificationId:', notificationId);
    console.log('  - dealer_id:', dealer_id);

    if (!dealer_id) {
      return NextResponse.json({ error: 'dealer_id is required' }, { status: 400 });
    }

    // Get the notification details (support both order_placed and orders_placed)
    const notifications = await executeQuery(
      'SELECT * FROM notifications WHERE id = ? AND dealer_id = ? AND type IN (?, ?)',
      [notificationId, dealer_id, 'order_placed', 'orders_placed'],
      2,
      false
    );

    console.log('  - notifications result:', {
      isArray: Array.isArray(notifications),
      length: Array.isArray(notifications) ? notifications.length : undefined
    });

    if (!Array.isArray(notifications) || notifications.length === 0) {
      console.log('❌ Notification not found - this could be due to:');
      console.log('   1. Wrong database connection (check .env.local)');
      console.log('   2. Notification ID does not exist');
      console.log('   3. Wrong dealer_id or notification type');
      return NextResponse.json({ 
        error: 'Notification not found or not an order_placed notification',
        details: 'Check database connection and notification ID'
      }, { status: 404 });
    }

    const notification = notifications[0] as any;
    console.log('✅ Notification found:', {
      id: notification.id,
      type: notification.type,
      dealer_id: notification.dealer_id,
      has_metadata: !!notification.metadata
    });
    
    // Extract ALL information from metadata only
    let orderId, orderData;
    let orderIds: string[] = [];
    
    if (notification.metadata) {
      try {
        // Handle metadata as object (not JSON string)
        const metadata = typeof notification.metadata === 'string' 
          ? JSON.parse(notification.metadata) 
          : notification.metadata;
        
        orderId = metadata.order_id || metadata.orderId || metadata.primary_order_id;
        // Collect multiple order IDs if present
        if (Array.isArray(metadata.order_ids)) {
          orderIds = metadata.order_ids.filter((oid: any) => typeof oid === 'string' && oid.trim() !== '');
        }
        if (orderId && !orderIds.includes(orderId)) {
          orderIds.push(orderId);
        }
        // Normalize items array to include product_id when available
        const items = Array.isArray(metadata.items) ? metadata.items : [];
        const normalizedItems = items.map((it: any) => ({
          product_id: it.product_id || metadata.product_id,
          quantity: it.quantity || it.qty || 1
        }));
        orderData = { ...metadata, items: normalizedItems };
        console.log('  - Extracted order_id from metadata:', orderId);
        console.log('  - Extracted order data from metadata:', {
          customer_name: metadata.customer_name,
          customer_email: metadata.customer_email,
          total_amount: metadata.total_amount,
          order_status: metadata.order_status
        });
      } catch (error) {
        console.error('  - Error parsing metadata:', error);
        return NextResponse.json({ error: 'Invalid metadata format' }, { status: 400 });
      }
    }

    if (singleOrderIdFromBody && !orderIds.includes(singleOrderIdFromBody)) {
      orderIds.push(singleOrderIdFromBody);
    }

    if (!orderId && orderIds.length === 0) {
      return NextResponse.json({ error: 'Order ID(s) not found in metadata' }, { status: 400 });
    }

    // Use order data from metadata instead of fetching from database
    const order = orderData;

    // Check if order is still pending (case insensitive)
    if (order.order_status && String(order.order_status).toLowerCase() !== 'pending') {
      // Continue anyway for safety in multi-orders scenario
      console.warn('⚠️ Metadata indicates non-pending status; proceeding with update');
    }

    // Update all related order rows to processing
    const targetOrderIds = (orderIds.length > 0) ? orderIds : (orderId ? [orderId] : []);
    if (targetOrderIds.length > 1) {
      // Multi-order notification - update by order_id only
      for (const oid of targetOrderIds) {
        await executeQuery(
          'UPDATE orders SET order_status = ? WHERE order_id = ?',
          ['processing', oid],
          2,
          false
        );
      }
    } else {
      // Single order - if items present, optionally narrow by product_id
      if (Array.isArray(order.items) && order.items.length > 0) {
        for (const it of order.items) {
          const productId = it.product_id;
          await executeQuery(
            'UPDATE orders SET order_status = ? WHERE order_id = ?' + (productId ? ' AND product_id = ?' : ''),
            productId ? ['processing', orderId, productId] : ['processing', orderId],
            2,
            false
          );
        }
      } else if (orderId) {
        await executeQuery(
          'UPDATE orders SET order_status = ? WHERE order_id = ?',
          ['processing', orderId],
          2,
          false
        );
      }
    }

    // Send email notification to customer
    try {
      await emailService.sendOrderAcceptedEmail(order);
      console.log('✅ Order accepted email sent to customer');
    } catch (emailError) {
      console.error('❌ Failed to send order accepted email:', emailError);
      // Continue even if email fails - don't let email failure break the API
    }

    // Update original notification to mark it as accepted and keep it visible to dealer
    const acceptedDescription = `Order ${orderId} has been successfully accepted and is now being processed. The order will be prepared for shipping and the customer will be notified of the status change. This order is now in the processing phase and should be fulfilled according to the standard delivery timeline.`;
    await executeQuery(
      'UPDATE notifications SET type = ?, title = ?, message = ?, description = ? WHERE id = ?',
      [
        'order_accepted',
        'Order Accepted',
        `Order ${orderId} has been accepted`,
        acceptedDescription,
        notificationId
      ],
      2,
      false
    );

    console.log('✅ Order accepted successfully via notification');

    return NextResponse.json({
      success: true,
      message: 'Order accepted successfully',
      order_id: orderId,
      new_status: 'processing'
    });

  } catch (error) {
    console.error('❌ Accept order via notification error:', error);
    return NextResponse.json({ 
      error: 'Failed to accept order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
