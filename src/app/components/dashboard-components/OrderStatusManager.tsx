'use client';

import { useState } from 'react';
import { FiCheck, FiX, FiEdit, FiMail } from 'react-icons/fi';
import LoadingButton from '../ui/LoadingButton';

interface OrderStatusManagerProps {
  order: any;
  onStatusUpdate: (orderId: string, newStatus: string, paymentStatus: string) => Promise<void>;
  onAcceptOrder: (orderId: string) => Promise<void>;
  onRejectOrder: (orderId: string) => Promise<void>;
}

const orderStatusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'returned_refunded', label: 'Returned/Refunded', color: 'bg-orange-100 text-orange-800' },
  { value: 'failed_delivery', label: 'Failed Delivery', color: 'bg-gray-100 text-gray-800' },
];

export default function OrderStatusManager({ 
  order, 
  onStatusUpdate, 
  onAcceptOrder, 
  onRejectOrder 
}: OrderStatusManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(order.order_status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const currentStatus = orderStatusOptions.find(status => status.value === order.order_status);

  const handleStatusUpdate = async () => {
    if (selectedStatus === order.order_status) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onStatusUpdate(order.order_id, selectedStatus, order.payment_status || 'pending');
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAcceptOrder = async () => {
    setIsAccepting(true);
    try {
      await onAcceptOrder(order.order_id);
    } catch (error) {
      console.error('Failed to accept order:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectOrder = async () => {
    setIsRejecting(true);
    try {
      await onRejectOrder(order.order_id);
    } catch (error) {
      console.error('Failed to reject order:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const canAcceptReject = order.order_status === 'pending';
  const canEdit = order.order_status !== 'cancelled' && order.order_status !== 'rejected';

  return (
    <div className="space-y-4">
      {/* Current Status Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="text-sm font-medium text-gray-700">
            <span className="sm:hidden">Status:</span>
            <span className="hidden sm:inline">Current Status:</span>
          </span>
          {currentStatus && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          )}
        </div>
        
        {!isEditing && canEdit && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <FiEdit className="h-4 w-4" />
            <span>Edit Status</span>
          </button>
        )}
      </div>

      {/* Accept/Reject Buttons for Pending Orders */}
      {canAcceptReject && (
        <div className="grid grid-cols-2 gap-3">
          <LoadingButton
            onClick={handleAcceptOrder}
            loading={isAccepting}
            disabled={isRejecting}
            variant="success"
            size="sm"
            className="flex items-center justify-center space-x-2"
          >
            <FiCheck className="h-4 w-4" />
            <span>Accept Order</span>
          </LoadingButton>
          
          <LoadingButton
            onClick={handleRejectOrder}
            loading={isRejecting}
            disabled={isAccepting}
            variant="danger"
            size="sm"
            className="flex items-center justify-center space-x-2"
          >
            <FiX className="h-4 w-4" />
            <span>Reject Order</span>
          </LoadingButton>
        </div>
      )}

      {/* Status Update Form */}
      {isEditing && canEdit && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Status
            </label>
                         <select
               value={selectedStatus}
               onChange={(e) => setSelectedStatus(e.target.value)}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
             >
              {orderStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LoadingButton
              onClick={handleStatusUpdate}
              loading={isUpdating}
              variant="primary"
              size="sm"
              className="flex items-center justify-center space-x-2"
            >
              <FiMail className="h-4 w-4" />
              <span>
                <span className="sm:hidden">Update</span>
                <span className="hidden sm:inline">Update & Notify</span>
              </span>
            </LoadingButton>
            
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedStatus(order.order_status);
              }}
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status Flow Information */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Status Flow:</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <p>• <strong>Pending:</strong> Order received, awaiting dealer approval</p>
          <p>• <strong>Processing:</strong> Order accepted, being prepared</p>
          <p>• <strong>Shipped:</strong> Order dispatched from warehouse</p>
          <p>• <strong>Out for Delivery:</strong> Order with delivery partner</p>
          <p>• <strong>Delivered:</strong> Order successfully delivered</p>
          <p>• <strong>Cancelled:</strong> Order rejected by dealer</p>
          <p>• <strong>Returned/Refunded:</strong> Order returned and refunded</p>
          <p>• <strong>Failed Delivery:</strong> Delivery attempt failed</p>
        </div>
      </div>
      
      {/* Note for cancelled/rejected orders */}
      {!canEdit && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h4 className="text-sm font-medium text-red-900 mb-2">⚠️ Order Status:</h4>
          <div className="text-xs text-red-800">
            <p>This order has been {order.order_status === 'cancelled' ? 'cancelled' : 'rejected'} and cannot be edited. You can only delete this order.</p>
          </div>
        </div>
      )}
    </div>
  );
}
