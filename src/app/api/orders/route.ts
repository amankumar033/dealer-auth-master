import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeTransaction, queries, generateOrderId } from '@/lib/database';
import { 
  validateOrderData, 
  formatErrorResponse 
} from '@/lib/validation';
import { CreateOrderRequest } from '@/types/database';
import { getIndiaTimestamp } from '@/lib/utils';

// GET /api/orders - Get all orders for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealer_id');
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');

    console.log('Orders API GET: Received params:', { dealerId, userId, status });

    // Support both dealer_id and user_id for flexibility
    const id = dealerId || userId;
    if (!id) {
      return NextResponse.json(
        { error: 'Either dealer_id or user_id is required' },
        { status: 400 }
      );
    }

    let query = queries.getOrders;
    let params = [id, id]; // Pass same ID for both dealer_id and user_id

    if (status) {
      query = queries.getOrdersByStatus;
      params = [id, id, status]; // Pass same ID for both dealer_id and user_id
    }

    console.log('Orders API GET: Executing query with params:', params);
    const orders = await executeQuery(query, params, 2, true) as any[];
    console.log('Orders API GET: Found orders:', orders.length);

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    const errorResponse = formatErrorResponse(error, 'Orders GET API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    
    console.log('Orders API POST: Received request body:', body);
    
    // Validate order data using comprehensive validation
    const validation = validateOrderData(body);
    if (!validation.isValid) {
      console.error('Orders API POST: Validation failed:', validation.errors);
      return NextResponse.json({ 
        error: 'Invalid order data',
        details: validation.errors 
      }, { status: 400 });
    }
    
    const sanitizedData = validation.sanitizedData!;
    console.log('Orders API POST: Sanitized data:', sanitizedData);
    
    // Generate order ID
    let orderId;
    try {
      orderId = await generateOrderId();
      console.log('Orders API POST: Generated order ID:', orderId);
    } catch (idError) {
      console.error('Orders API POST: Error generating order ID:', idError);
      return NextResponse.json({ error: 'Failed to generate order ID' }, { status: 500 });
    }

    // Create order
    const orderQueries = [
      {
        query: queries.createOrder,
        params: [
          orderId,
          sanitizedData.user_id,
          sanitizedData.dealer_id,
          sanitizedData.product_id,
          sanitizedData.quantity,
          sanitizedData.customer_name,
          sanitizedData.customer_email,
          sanitizedData.customer_phone,
          sanitizedData.shipping_address,
          sanitizedData.shipping_pincode,
          sanitizedData.total_amount,
          sanitizedData.tax_amount,
          sanitizedData.shipping_cost,
          sanitizedData.discount_amount,
          sanitizedData.payment_method,
          sanitizedData.transaction_id
        ]
      }
    ];

    console.log('Orders API POST: Creating order with params:', orderQueries[0].params);
    
    try {
      const orderResult = await executeTransaction(orderQueries);
      console.log('Orders API POST: Order created successfully:', orderResult);
    } catch (createError) {
      console.error('Orders API POST: Error creating order:', createError);
      return NextResponse.json({ error: 'Failed to create order in database' }, { status: 500 });
    }

    // Get the created order
    try {
      const orders = await executeQuery(queries.getOrderById, [orderId, sanitizedData.dealer_id, sanitizedData.user_id], 2, true) as any[];
      const order = orders[0];
      console.log('Orders API POST: Retrieved created order:', order);
      
      if (!order) {
        console.error('Orders API POST: Order not found after creation');
        return NextResponse.json({ error: 'Order created but not found' }, { status: 500 });
      }

      // Create notification for order placement
      try {
        await createOrderNotification(order);
        console.log('Orders API POST: Order notification created successfully');
      } catch (notificationError) {
        console.error('Orders API POST: Failed to create order notification:', notificationError);
        // Don't fail the request if notification fails
      }
      
      return NextResponse.json(order, { status: 201 });
    } catch (retrieveError) {
      console.error('Orders API POST: Error retrieving created order:', retrieveError);
      return NextResponse.json({ error: 'Order created but failed to retrieve' }, { status: 500 });
    }
  } catch (error) {
    console.error('Orders API POST: Unexpected error:', error);
    const errorResponse = formatErrorResponse(error, 'Orders POST API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Helper function to create order notification
async function createOrderNotification(order: any) {
  try {
    const notificationData = {
      type: 'order_placed',
      title: 'New Order Received',
      message: `New order ${order.order_id} received from ${order.customer_name}`,
      description: `A new order has been placed by ${order.customer_name} (${order.customer_email}). Order ID: ${order.order_id}. Total amount: ₹${order.total_amount}. The order is currently in pending status and requires dealer review. Please review the order details and take appropriate action to accept or reject the order. Customer shipping address: ${order.shipping_address}, Pincode: ${order.shipping_pincode}.`,
      for_admin: 0,
      for_dealer: 1,
      for_user: 0,
      for_vendor: 0,
      order_id: order.order_id,
      dealer_id: order.dealer_id,
      user_id: order.user_id,
      metadata: JSON.stringify({
        items: [
          {
            name: order.product_name,
            product_name: order.product_name,
            product_id: order.product_id,
            quantity: order.quantity || order.qauntity || 1,
            price: order.product_price,
            subtotal: order.total_amount
          }
        ],
        product_name: order.product_name,
        product_id: order.product_id,
        product_ids: [order.product_id],
        quantity: order.quantity || order.qauntity || 1,
        order_id: order.order_id,
        order_date: order.order_date,
        order_status: order.order_status,
        total_amount: order.total_amount,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        payment_status: order.payment_status,
        shipping_address: order.shipping_address,
        shipping_pincode: order.shipping_pincode
      })
    };

    const indiaTime = getIndiaTimestamp();
    const result = await executeQuery(
      'INSERT INTO notifications (type, title, message, description, for_admin, for_dealer, for_user, for_vendor, order_id, dealer_id, user_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [notificationData.type, notificationData.title, notificationData.message, notificationData.description, notificationData.for_admin, notificationData.for_dealer, notificationData.for_user, notificationData.for_vendor, notificationData.order_id, notificationData.dealer_id, notificationData.user_id, notificationData.metadata, indiaTime]
    );

    console.log('Order notification stored in database:', result);
  } catch (error) {
    console.error('Failed to create order notification:', error);
    throw error;
  }
} 