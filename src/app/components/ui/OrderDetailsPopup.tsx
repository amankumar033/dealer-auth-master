'use client';

import React from 'react';
import { Order } from '@/types/database';
import { FiX, FiPackage, FiUser, FiMapPin, FiCalendar, FiDollarSign, FiTruck, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import { formatCurrency, safeNumber } from '@/lib/utils';
import { useToast } from '@/app/components/ui/ToastContainer';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import OrderStatusManager from '../dashboard-components/OrderStatusManager';

interface OrderDetailsPopupProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string, paymentStatus: string) => Promise<void>;
  onAcceptOrder: (orderId: string) => Promise<void>;
  onRejectOrder: (orderId: string) => Promise<void>;
  onDeleteOrder?: (orderId: string) => Promise<void>;
  getImageSrc: (imageData: any) => string | null;
}

export default function OrderDetailsPopup({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onAcceptOrder,
  onRejectOrder,
  onDeleteOrder,
  getImageSrc
}: OrderDetailsPopupProps) {
  const [updating, setUpdating] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const { showSuccess, showError } = useToast();

  // Function to safely render any value
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(value)) {
      return value.toString('utf8');
    }
    
    if (typeof value === 'object' && value && value.type === 'Buffer') {
      try {
        if (typeof Buffer !== 'undefined') {
          const buffer = Buffer.from(value.data);
          return buffer.toString('utf8');
        } else {
          return JSON.stringify(value);
        }
      } catch (error) {
        console.error('Error converting Buffer object to string:', error);
        return '';
      }
    }
    
    return String(value);
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

  // Handle delete order
  const handleDeleteOrder = async () => {
    if (!order || !onDeleteOrder) return;
    
    try {
      setDeleting(true);
      await onDeleteOrder(order.order_id);
      onClose();
    } catch (error) {
      console.error('Failed to delete order:', error);
    } finally {
      setDeleting(false);
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

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!order) return;
    
    try {
      setUpdating(true);
      // Update to 'delivered' status instead of 'Completed' to match our new status options
      await onUpdateStatus(order.order_id, 'delivered', 'paid');
      showSuccess('Order status updated successfully!');
      onClose();
    } catch (error) {
      showError('Failed to update order status', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setUpdating(false);
    }
  };

  // Check if order is already completed/delivered
  const isOrderCompleted = order?.order_status?.toLowerCase() === 'delivered';

  if (!isOpen || !order) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col form-transition -mx-2 lg:-mx-6">
      <div className="bg-white rounded-lg  shadow-sm border border-gray-200 relative w-full max-w-4xl mx-auto form-scale-enter">


        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FiPackage className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Order Details: #{order.order_id}
                </h1>
                <p className="text-sm text-gray-600">
                  {formatDate(order.order_date)} • {safeRender(order.customer_name)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg h-8 w-8 flex items-center justify-center"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 px-3 sm:px-6 py-8">
          {/* Product Details Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiPackage className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-blue-900">
                    Product Information
                  </h2>
                  <p className="text-sm text-blue-700">
                    Product details for this order
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="p-6 bg-white border border-blue-200 rounded-b-lg mb-6">
            <div className="flex items-start space-x-4">
              {/* Product Image */}
              <div className="flex-shrink-0">
                {order.product_image && getImageSrc(order.product_image) ? (
                  <img
                    src={getImageSrc(order.product_image) || ''}
                    alt={safeRender(order.product_name)}
                    className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center border border-gray-200 ${order.product_image && getImageSrc(order.product_image) ? 'hidden' : ''}`}>
                  <FiPackage className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {safeRender(order.product_name) || 'Product Name Not Available'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p><span className="font-medium">Product ID:</span> {safeRender(order.product_id)}</p>
                    <p><span className="font-medium">Quantity:</span> 
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 ml-2">
                        {order.quantity}
                      </span>
                    </p>
                    <p><span className="font-medium">Unit Price:</span> {formatCurrency(order.product_price || order.total_amount)}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Brand:</span> {safeRender(order.brand_name) || 'N/A'}</p>
                    <p><span className="font-medium">Sub-Brand:</span> {safeRender(order.sub_brand_name) || 'N/A'}</p>
                    <p><span className="font-medium">Total Price:</span> {formatCurrency(order.total_amount)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200 rounded-t-lg mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FiUser className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-green-900">Customer Information</h2>
                <p className="text-sm text-green-700">Customer and shipping details</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Customer Details */}
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FiUser className="w-4 h-4 mr-2 text-green-600" />
                Customer Details
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Name:</span> {safeRender(order.customer_name)}</p>
                <p><span className="font-medium">Email:</span> {safeRender(order.customer_email)}</p>
                <p><span className="font-medium">Phone:</span> {safeRender(order.customer_phone) || 'N/A'}</p>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FiMapPin className="w-4 h-4 mr-2 text-green-600" />
                Shipping Address
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>{safeRender(order.shipping_address)}</p>
                <p><span className="font-medium">Pincode:</span> {safeRender(order.shipping_pincode)}</p>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-6 py-4 border-b border-purple-200 rounded-t-lg mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <FiCalendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-purple-900">Order Information</h2>
                <p className="text-sm text-purple-700">Order status and payment details</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Order Status */}
            <div className="bg-white border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FiCalendar className="w-4 h-4 mr-2 text-purple-600" />
                Order Status
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Order Date:</span> {formatDate(order.order_date)}</p>
                <p><span className="font-medium">Status:</span> 
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
                    {order.order_status}
                  </span>
                </p>
                <p><span className="font-medium">Payment Method:</span> {safeRender(order.payment_method)}</p>
                <p><span className="font-medium">Payment Status:</span>
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                    {order.payment_status}
                  </span>
                </p>
              </div>
            </div>

            {/* Financial Details */}
            <div className="bg-white border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="w-4 h-4 mr-2 text-purple-600 font-bold text-lg mb-3">₹</span>
                Financial Details
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Total Amount:</span> {formatCurrency(order.total_amount)}</p>
                <p><span className="font-medium">Tax Amount:</span> {formatCurrency(order.tax_amount)}</p>
                <p><span className="font-medium">Shipping Cost:</span> {formatCurrency(order.shipping_cost)}</p>
                <p><span className="font-medium">Discount:</span> {formatCurrency(order.discount_amount)}</p>
              </div>
            </div>
          </div>

          {/* Order Status Management */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200 rounded-t-lg mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FiTruck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-blue-900">Order Management</h2>
                <p className="text-sm text-blue-700">Update order status and manage notifications</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-blue-200 rounded-lg p-4 mb-6">
            <OrderStatusManager
              order={order}
              onStatusUpdate={onUpdateStatus}
              onAcceptOrder={onAcceptOrder}
              onRejectOrder={onRejectOrder}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 lg:px-6 py-3 lg:py-4 border-t border-gray-200">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-3 lg:space-y-0">
            <div className="text-xs lg:text-sm text-gray-600 text-center lg:text-left">
              Order ID: {order.order_id} • Last updated: {formatDate(order.order_date)}
            </div>
            <div className="grid grid-cols-2 lg:flex lg:justify-end gap-2 lg:gap-3">
              <button
                onClick={onClose}
                className="px-2 h-6 lg:px-4 lg:h-10 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200 text-xs lg:text-sm flex items-center justify-center"
              >
                Close
              </button>
              
              {/* Show delete button for cancelled and rejected orders */}
              {(order.order_status === 'cancelled' || order.order_status === 'rejected') && onDeleteOrder && (
                <button
                  onClick={handleDeleteOrder}
                  disabled={deleting}
                  className="px-2 h-6 lg:px-4 lg:h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-1 lg:space-x-2 text-xs lg:text-sm"
                >
                  {deleting ? (
                    <>
                      <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span>Delete Order</span>
                    </>
                  )}
                </button>
              )}
              
              {/* Show update button for non-cancelled/non-rejected orders */}
              {order.order_status !== 'cancelled' && order.order_status !== 'rejected' && (
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating || order.order_status === 'delivered'}
                  className={`px-2 h-6 lg:px-4 lg:h-10 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-1 lg:space-x-2 text-xs lg:text-sm ${
                    order.order_status === 'delivered' 
                      ? 'bg-green-100 text-green-800 cursor-default' 
                      : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {updating ? (
                    <>
                      <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span>{order.order_status === 'delivered' ? 'Order Delivered' : 'Mark as Delivered'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 