'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye, FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import { Order } from '@/types/database';
import { formatCurrency, safeNumber } from '@/lib/utils';
import { useToast } from '@/app/components/ui/ToastContainer';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import OrderDetailsPopup from '@/app/components/ui/OrderDetailsPopup';
import OrderStatusManager from '@/app/components/dashboard-components/OrderStatusManager';
import CustomDropdown from '@/app/components/ui/CustomDropdown';

interface OrdersManagerProps {
  userId: string; // Updated to use string ID
}

export default function OrdersManager({ userId }: OrdersManagerProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status' | 'customer'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  // Function to get image source from image data
  const getImageSrc = (imageData: any): string | null => {
    if (!imageData) return null;
    
    // If it's already a string URL
    if (typeof imageData === 'string') {
      return imageData.startsWith('http') ? imageData : `/api/upload/${imageData}`;
    }
    
    // If it's a Buffer object
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(imageData)) {
      return `data:image/jpeg;base64,${imageData.toString('base64')}`;
    }
    
    // If it's a Buffer object with type property
    if (typeof imageData === 'object' && imageData && imageData.type === 'Buffer') {
      try {
        if (typeof Buffer !== 'undefined') {
          const buffer = Buffer.from(imageData.data);
          return `data:image/jpeg;base64,${buffer.toString('base64')}`;
        }
      } catch (error) {
        console.error('Error converting Buffer object to base64:', error);
      }
    }
    
    return null;
  };

  // Delete order function
  const deleteOrder = async (orderId: string) => {
    try {
      setDeletingOrderId(orderId);
      const response = await fetch(`/api/orders/${orderId}?dealer_id=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete order');
      }

      showSuccess('Order deleted successfully');
      // Refresh orders list
      await fetchOrders(selectedStatus);
    } catch (error) {
      console.error('Error deleting order:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete order');
    } finally {
      setDeletingOrderId(null);
    }
  };

  // Function to safely convert any value to string for rendering
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Handle Buffer objects (only if Buffer is available in browser)
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(value)) {
      return value.toString('utf8');
    }
    
    // Handle Buffer objects with type property
    if (typeof value === 'object' && value && value.type === 'Buffer') {
      try {
        // Only use Buffer if it's available
        if (typeof Buffer !== 'undefined') {
          const buffer = Buffer.from(value.data);
          return buffer.toString('utf8');
        } else {
          // Fallback for browser environment
          return JSON.stringify(value);
        }
      } catch (error) {
        console.error('Error converting Buffer object to string:', error);
        return '';
      }
    }
    
    // Handle other types
    return String(value);
  };

  // Fetch orders from API
  const fetchOrders = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      console.log('OrdersManager: Fetching orders for dealerId:', userId, 'status:', status);
      
      const url = status && status !== 'all' 
        ? `/api/orders?dealer_id=${userId}&status=${status}`
        : `/api/orders?dealer_id=${userId}`;
      
      console.log('OrdersManager: Fetching from URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('OrdersManager: Received orders:', data);
      console.log('OrdersManager: Orders length:', Array.isArray(data) ? data.length : 'Not an array');
      
      // Debug: Log all unique status values
      if (Array.isArray(data)) {
        const uniqueStatuses = [...new Set(data.map((order: any) => order.order_status))];
        console.log('OrdersManager: Unique order statuses:', uniqueStatuses);
      }
      
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error('OrdersManager: Error fetching orders:', error);
      setError('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update order status
  const updateOrderStatus = async (orderId: string, status: string, paymentStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}?dealer_id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_status: status,
          payment_status: paymentStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle database connection errors specifically
        if (response.status === 503 && (errorData.code === 'DB_CONNECTION_ERROR' || errorData.code === 'DB_UNAVAILABLE')) {
          showError('Database Unavailable', 'The database server is currently offline. Please ensure MySQL is running and try again.');
          return;
        }
        
        throw new Error(errorData.message || 'Failed to update order');
      }

      // Refresh orders list
      fetchOrders(selectedStatus);
      setShowOrderDetails(false);
      setSelectedOrder(null);
      showSuccess('Order status updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order';
      setError(errorMessage);
      showError('Failed to update order', errorMessage);
    }
  };

  // Accept order
  const acceptOrder = async (orderId: string) => {
    try {
      console.log('OrdersManager: Accepting order:', orderId);
      
      const response = await fetch(`/api/orders/${orderId}/accept?dealer_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept order');
      }

      const result = await response.json();
      console.log('OrdersManager: Order accepted successfully:', result);

      // Update the orders list
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.order_id === orderId ? result.order : order
        )
      );

      showSuccess('Order accepted successfully');
    } catch (error) {
      console.error('OrdersManager: Error accepting order:', error);
      showError(error instanceof Error ? error.message : 'Failed to accept order');
    }
  };

  // Reject order
  const rejectOrder = async (orderId: string) => {
    try {
      console.log('OrdersManager: Rejecting order:', orderId);
      
      const response = await fetch(`/api/orders/${orderId}/reject?dealer_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject order');
      }

      const result = await response.json();
      console.log('OrdersManager: Order rejected successfully:', result);

      // Update the orders list
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.order_id === orderId ? result.order : order
        )
      );

      showSuccess('Order rejected successfully');
    } catch (error) {
      console.error('OrdersManager: Error rejecting order:', error);
      showError(error instanceof Error ? error.message : 'Failed to reject order');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export functionality
  const exportToCSV = () => {
    const headers = ['Order ID', 'Customer', 'Date', 'Amount', 'Status', 'Payment Status'];
    const csvData = filteredOrders.map(order => [
      order.order_id,
      safeRender(order.customer_name),
      formatDate(order.order_date),
      order.total_amount,
      order.order_status,
      order.payment_status
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter and sort orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = safeRender(order.customer_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_id.toString().includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || order.order_status === selectedStatus;
    
    // Debug logging
    console.log('Filtering order:', {
      orderId: order.order_id,
      customerName: safeRender(order.customer_name),
      orderStatus: order.order_status,
      selectedStatus,
      matchesSearch,
      matchesStatus,
      searchTerm
    });
    
    return matchesSearch && matchesStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.order_date);
        bValue = new Date(b.order_date);
        break;
      case 'amount':
        aValue = parseFloat(a.total_amount.toString());
        bValue = parseFloat(b.total_amount.toString());
        break;
      case 'status':
        aValue = a.order_status.toLowerCase();
        bValue = b.order_status.toLowerCase();
        break;
      case 'customer':
        aValue = a.customer_name.toLowerCase();
        bValue = b.customer_name.toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned_refunded':
        return 'bg-orange-100 text-orange-800';
      case 'failed_delivery':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get payment status badge color
  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (selectedStatus !== 'all') {
      fetchOrders(selectedStatus);
    } else {
      fetchOrders();
    }
  }, [selectedStatus, fetchOrders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading orders..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="text-red-800">
            <p className="font-medium">Error loading orders</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // If order details popup is open, show the popup instead of orders list
  if (showOrderDetails && selectedOrder) {
    return (
      <OrderDetailsPopup
        order={selectedOrder}
        isOpen={showOrderDetails}
        onClose={() => {
          setShowOrderDetails(false);
          setSelectedOrder(null);
        }}
        onUpdateStatus={updateOrderStatus}
        onAcceptOrder={acceptOrder}
        onRejectOrder={rejectOrder}
        onDeleteOrder={deleteOrder}
        getImageSrc={getImageSrc}
      />
    );
  }

  return (
    <div className="space-y-6 form-transition">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">Orders Management</h2>
        
        {/* Search, Filter, and Export Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 text-gray-600 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md focus:shadow-lg"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-md text-sm"
          >
            <FiFilter className="mr-2 transition-transform duration-300" />
            <span className="text-gray-500">Filters</span>
          </button>

          {filteredOrders.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center px-2 lg:px-4 h-4 lg:h-auto lg:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs lg:text-sm font-medium"
            >
              <FiDownload className="mr-1 lg:mr-2 w-3 h-3 lg:w-4 lg:h-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Filters */}
      {showFilters && (
        <div className="mb-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl shadow-lg transition-all duration-500 ease-out transform hover:scale-[1.01]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <CustomDropdown
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'processing', label: 'Processing' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'out_for_delivery', label: 'Out for Delivery' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'returned_refunded', label: 'Returned/Refunded' },
                { value: 'failed_delivery', label: 'Failed Delivery' }
              ]}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Select status"
              label="Status"
              className="text-xs lg:text-sm"
              maxHeight="max-h-48"
            />
            
            <CustomDropdown
              options={[
                { value: 'date', label: 'Date' },
                { value: 'amount', label: 'Amount' },
                { value: 'status', label: 'Status' },
                { value: 'customer', label: 'Customer' }
              ]}
              value={sortBy}
              onChange={(value) => setSortBy(value as 'date' | 'amount' | 'status' | 'customer')}
              placeholder="Select sort field"
              label="Sort By"
              className="text-xs lg:text-sm"
              maxHeight="max-h-48"
            />
            
            <CustomDropdown
              options={[
                { value: 'desc', label: 'Newest First' },
                { value: 'asc', label: 'Oldest First' }
              ]}
              value={sortOrder}
              onChange={(value) => setSortOrder(value as 'asc' | 'desc')}
              placeholder="Select sort order"
              label="Order"
              className="text-xs lg:text-sm"
              maxHeight="max-h-48"
            />
          </div>
        </div>
      )}

      {/* Results Counter */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-gray-600 mb-4 space-y-2 sm:space-y-0">
        <div className="text-center sm:text-left">
          Showing {filteredOrders.length} of {orders.length} orders
          {(searchTerm || selectedStatus !== 'all') && (
            <span className="text-blue-600 font-medium">
              {' '}(filtered)
            </span>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOrders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-gray-50 transition-all duration-500 ease-out transform hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100 border border-transparent hover:border-blue-200 rounded-lg">
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 transition-colors duration-300">
                      #{order.order_id}
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {order.product_image && (
                          <img 
                            src={getImageSrc(order.product_image) || ''} 
                            alt={order.product_name || 'Product'} 
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 transition-colors duration-300 truncate">
                            {safeRender(order.product_name || 'Product')}
                          </div>
                          {order.brand_name && (
                            <div className="text-xs text-gray-500 transition-colors duration-300 truncate">
                              {safeRender(order.brand_name)}
                              {order.sub_brand_name && ` - ${safeRender(order.sub_brand_name)}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 transition-colors duration-300">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {order.quantity}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 transition-colors duration-300">{safeRender(order.customer_name)}</div>
                        <div className="text-sm text-gray-500 transition-colors duration-300">{safeRender(order.customer_email)}</div>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 transition-colors duration-300">
                      {formatDate(order.order_date)}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 transition-colors duration-300">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-110 ${getStatusColor(order.order_status)}`}>
                          {order.order_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-110 ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* Show Edit button for non-cancelled/non-rejected/non-refunded/non-returned orders (case-insensitive) */}
                        {(() => {
                          const normalizedStatus = (order.order_status || '').toString().toLowerCase();
                          const disallowed = new Set(['cancelled', 'rejected', 'canceled', 'refunded', 'returned']);
                          return !disallowed.has(normalizedStatus);
                        })() && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-2 transition-all duration-300 hover:scale-125 hover:bg-blue-100 rounded-lg hover:shadow-md font-semibold"
                          >
                            <FiEdit className="w-4 h-4 mr-1 inline" />
                            Edit
                          </button>
                        )}
                        
                        {/* Show Delete button for cancelled and rejected orders (case-insensitive) */}
                        {(() => {
                          const normalizedStatus = (order.order_status || '').toString().toLowerCase();
                          return normalizedStatus === 'cancelled' || normalizedStatus === 'rejected' || normalizedStatus === 'canceled';
                        })() && (
                          <button
                            onClick={() => deleteOrder(order.order_id)}
                            disabled={deletingOrderId === order.order_id}
                            className="text-red-600 hover:text-red-900 p-2 transition-all duration-300 hover:scale-125 hover:bg-red-100 rounded-lg hover:shadow-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingOrderId === order.order_id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-1 inline"></div>
                            ) : (
                              <FiTrash2 className="w-4 h-4 mr-1 inline" />
                            )}
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
} 