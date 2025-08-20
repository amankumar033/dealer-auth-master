import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { 
  validateRequestParams, 
  validateUpdateData, 
  formatErrorResponse,
  sanitizeVarcharId 
} from '@/lib/validation';
import { UpdateOrderRequest } from '@/types/database';
import { emailService } from '@/lib/email';

// Helper function to extract order ID
function extractOrderId(id: string): string {
  return id;
}

// GET /api/orders/[id] - Get a specific order
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
    const orderId = extractOrderId(id);
    const sanitizedOrderId = sanitizeVarcharId(orderId);
    const sanitizedDealerId = paramValidation.sanitizedData!.dealer_id;
    
    if (!sanitizedOrderId) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }
    
    // Use simplified query with only dealer_id check
    const orders = await executeQuery(
      'SELECT o.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone, d.business_address as dealer_address, d.pincode as dealer_pincode, p.name as product_name, p.image_1 as product_image FROM orders o LEFT JOIN dealers d ON o.dealer_id = d.dealer_id LEFT JOIN products p ON o.product_id = p.product_id WHERE o.order_id = ? AND o.dealer_id = ?',
      [sanitizedOrderId, sanitizedDealerId]
    ) as any[];
    
    const order = orders[0];
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    const errorResponse = formatErrorResponse(error, 'Order GET API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT /api/orders/[id] - Update a specific order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealer_id');
    const body: UpdateOrderRequest = await request.json();

    console.log('Order update request:', { dealerId, body });

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
    const orderId = extractOrderId(id);
    const sanitizedOrderId = sanitizeVarcharId(orderId);
    const sanitizedDealerId = paramValidation.sanitizedData!.dealer_id;
    
    if (!sanitizedOrderId) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    // Validate update data
    const allowedFields = ['order_status', 'payment_status'];
    
    const updateValidation = validateUpdateData(body, allowedFields);
    if (!updateValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid update data',
        details: updateValidation.errors 
      }, { status: 400 });
    }

    console.log('Validated update data:', updateValidation.sanitizedData);

    // Check if order exists first
    const existingOrders = await executeQuery(
      'SELECT * FROM orders WHERE order_id = ? AND dealer_id = ?',
      [sanitizedOrderId, sanitizedDealerId]
    ) as any[];
    
    if (!existingOrders || existingOrders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Prepare update parameters
    const updateData = updateValidation.sanitizedData!;
    const updateParams = [
      updateData.order_status || 'Processing',
      updateData.payment_status || 'Pending',
      sanitizedOrderId,
      sanitizedDealerId
    ];

    console.log('Update parameters:', updateParams);

    // Get the original order status for comparison
    const originalOrder = existingOrders[0];
    const originalStatus = originalOrder.order_status;

    // Update order using direct query
    const updateResult = await executeQuery(
      'UPDATE orders SET order_status = ?, payment_status = ? WHERE order_id = ? AND dealer_id = ?',
      updateParams
    );

    console.log('Update result:', updateResult);

    // Send email notification if status changed
    if (updateData.order_status && updateData.order_status !== originalStatus) {
      try {
        await emailService.sendOrderStatusUpdateEmail(originalOrder, updateData.order_status);
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Get updated order
    const updatedOrders = await executeQuery(
      'SELECT o.*, d.business_name, d.name as dealer_name, d.phone as dealer_phone, d.business_address as dealer_address, d.pincode as dealer_pincode, p.name as product_name, p.image_1 as product_image FROM orders o LEFT JOIN dealers d ON o.dealer_id = d.dealer_id LEFT JOIN products p ON o.product_id = p.product_id WHERE o.order_id = ? AND o.dealer_id = ?',
      [sanitizedOrderId, sanitizedDealerId]
    ) as any[];

    const updatedOrder = updatedOrders[0];

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated order' },
        { status: 500 }
      );
    }

    console.log('Successfully updated order:', updatedOrder.order_id);
    return NextResponse.json(updatedOrder);
    
  } catch (error: any) {
    console.error('Error updating order:', error);
    
    // Check if it's a database connection error
    if (error.message?.includes('Malformed communication packet') || 
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('connect ETIMEDOUT')) {
      return NextResponse.json({
        error: 'Database connection failed',
        message: 'Unable to connect to the database. Please ensure the MySQL server is running.',
        details: 'The database server appears to be offline or not accessible.',
        code: 'DB_CONNECTION_ERROR'
      }, { status: 503 });
    }
    
    const errorResponse = formatErrorResponse(error, 'Order PUT API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/orders/[id] - Delete a specific order
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
    const orderId = extractOrderId(id);
    const sanitizedOrderId = sanitizeVarcharId(orderId);
    const sanitizedDealerId = paramValidation.sanitizedData!.dealer_id;
    
    if (!sanitizedOrderId) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    // Check if order exists
    const existingOrders = await executeQuery(
      'SELECT * FROM orders WHERE order_id = ? AND dealer_id = ?',
      [sanitizedOrderId, sanitizedDealerId]
    ) as any[];
    
    if (!existingOrders || existingOrders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Delete order
    await executeQuery(
      'DELETE FROM orders WHERE order_id = ? AND dealer_id = ?',
      [sanitizedOrderId, sanitizedDealerId]
    );

    return NextResponse.json(
      { message: 'Order deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting order:', error);
    const errorResponse = formatErrorResponse(error, 'Order DELETE API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 