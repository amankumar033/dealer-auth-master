import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { 
  validateRequestParams, 
  formatErrorResponse,
  sanitizeVarcharId 
} from '@/lib/validation';
import { emailService } from '@/lib/email';

// POST /api/orders/[id]/reject - Reject an order
export async function POST(
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
    const orderId = sanitizeVarcharId(id);
    const sanitizedDealerId = paramValidation.sanitizedData!.dealer_id;
    
    if (!orderId) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    // Get the order details first
    const orders = await executeQuery(
      'SELECT o.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone, d.business_address as dealer_address, d.pincode as dealer_pincode, p.name as product_name, p.image_1 as product_image FROM orders o LEFT JOIN dealers d ON o.dealer_id = d.dealer_id LEFT JOIN products p ON o.product_id = p.product_id WHERE o.order_id = ? AND o.dealer_id = ?',
      [orderId, sanitizedDealerId]
    ) as any[];
    
    const order = orders[0];
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is in pending status
    if (order.order_status !== 'pending') {
      return NextResponse.json(
        { error: 'Order cannot be rejected. Only pending orders can be rejected.' },
        { status: 400 }
      );
    }

    // Update order status to rejected
    await executeQuery(
      'UPDATE orders SET order_status = ? WHERE order_id = ? AND dealer_id = ?',
      ['rejected', orderId, sanitizedDealerId]
    );

    // Send rejection email
    try {
      await emailService.sendOrderRejectedEmail(order);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail the request if email fails
    }

    // Get updated order
    const updatedOrders = await executeQuery(
      'SELECT o.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone, d.business_address as dealer_address, d.pincode as dealer_pincode, p.name as product_name, p.image_1 as product_image FROM orders o LEFT JOIN dealers d ON o.dealer_id = d.dealer_id LEFT JOIN products p ON o.product_id = p.product_id WHERE o.order_id = ? AND o.dealer_id = ?',
      [orderId, sanitizedDealerId]
    ) as any[];

    const updatedOrder = updatedOrders[0];

    console.log('Order rejected successfully:', updatedOrder.order_id);
    return NextResponse.json({
      message: 'Order rejected successfully',
      order: updatedOrder
    });
    
  } catch (error) {
    console.error('Error rejecting order:', error);
    const errorResponse = formatErrorResponse(error, 'Order Reject API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
