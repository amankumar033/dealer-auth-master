'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { formatRelativeTime } from '@/lib/utils';
import { 
  FiBell, 
  FiX, 
  FiCheck, 
  FiXCircle, 
  FiPackage, 
  FiShoppingCart, 
  FiTrash2, 
  FiEye,
  FiClock,
  FiUser,
  FiTag,
  FiRefreshCw
} from 'react-icons/fi';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  for_admin: number;
  for_dealer: number;
  for_user: number;
  for_vendor: number;
  product_id?: string;
  order_id?: string;
  user_id?: string;
  vendor_id?: string;
  dealer_id?: string;
  is_read: number;
  is_delivered: number;
  metadata?: string;
  created_at: string;
}

interface NotificationBellProps {
  dealerId: string;
  onNavigateToNotifications?: () => void;
  onNavigateToSpecificNotification?: (notificationId: string) => void;
}

export default function NotificationBell({ dealerId, onNavigateToNotifications, onNavigateToSpecificNotification }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [loadingStates, setLoadingStates] = useState<{ [key: number]: boolean }>({});
  const [acceptRejectLoading, setAcceptRejectLoading] = useState<{ [key: number]: { accept: boolean; reject: boolean } }>({});
  const [isDesktop, setIsDesktop] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if screen is desktop
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?dealer_id=${dealerId}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        // Handle new API response format with pagination
        const notificationsData = data.notifications || data;
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      console.log('🔔 Marking notification as read:', notificationId);
      setLoadingStates(prev => ({ ...prev, [notificationId]: true }));
      
      const requestBody = { notificationId, isRead: true };
      console.log('🔔 Request body:', requestBody);
      
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('🔔 Response status:', response.status);
      const responseData = await response.json();
      console.log('🔔 Response data:', responseData);
      
      if (response.ok) {
        console.log('🔔 Successfully marked as read, updating local state');
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        console.log('🔔 Local state updated successfully');
      } else {
        console.error('Failed to mark notification as read:', response.status, responseData);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  // Remove notification (set for_dealer to 0)
  const removeNotification = async (notificationId: number) => {
    try {
      setLoadingStates(prev => ({ ...prev, [notificationId]: true }));
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId,
          for_dealer: 0 // Set for_dealer to 0 to remove from dealer view
        }),
      });

      if (response.ok) {
        // Remove from local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        console.log('Notification removed successfully');
      } else {
        console.error('Failed to remove notification');
      }
    } catch (error) {
      console.error('Error removing notification:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  // Accept order via notification
  const acceptOrder = async (notificationId: number) => {
    try {
      setAcceptRejectLoading(prev => ({ 
        ...prev, 
        [notificationId]: { ...prev[notificationId], accept: true } 
      }));
      
      const response = await fetch(`/api/notifications/${notificationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealer_id: dealerId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Order accepted:', result);
        
        // Refresh notifications to show updated status
        await fetchNotifications();
      } else {
        // Handle error response more robustly
        let errorMessage = 'Failed to accept order';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Failed to accept order:', errorData);
        } catch (parseError) {
          // If response is not JSON, get the text
          const errorText = await response.text();
          console.error('Failed to accept order - non-JSON response:', errorText);
          errorMessage = errorText || errorMessage;
        }
        
        // Show error to user (you can add a toast notification here)
        console.error('Accept order error:', errorMessage);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    } finally {
      setAcceptRejectLoading(prev => ({ 
        ...prev, 
        [notificationId]: { ...prev[notificationId], accept: false } 
      }));
    }
  };

  // Reject order via notification
  const rejectOrder = async (notificationId: number) => {
    try {
      setAcceptRejectLoading(prev => ({ 
        ...prev, 
        [notificationId]: { ...prev[notificationId], reject: true } 
      }));
      
      const response = await fetch(`/api/notifications/${notificationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealer_id: dealerId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Order rejected:', result);
        
        // Refresh notifications to show updated status
        await fetchNotifications();
      } else {
        // Handle error response more robustly
        let errorMessage = 'Failed to reject order';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Failed to reject order:', errorData);
        } catch (parseError) {
          // If response is not JSON, get the text
          const errorText = await response.text();
          console.error('Failed to reject order - non-JSON response:', errorText);
          errorMessage = errorText || errorMessage;
        }
        
        // Show error to user (you can add a toast notification here)
        console.error('Reject order error:', errorMessage);
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
    } finally {
      setAcceptRejectLoading(prev => ({ 
        ...prev, 
        [notificationId]: { ...prev[notificationId], reject: false } 
      }));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => 
          fetch('/api/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: n.id, isRead: true })
          })
        )
      );
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'product_created':
        return <FiPackage className="w-4 h-4 text-blue-700" />;
      case 'product_approved':
        return <FiCheck className="w-4 h-4 text-green-700" />;
      case 'product_rejected':
        return <FiXCircle className="w-4 h-4 text-red-700" />;
      case 'order_placed':
        return <FiShoppingCart className="w-4 h-4 text-blue-700" />;
      case 'order_accepted':
        return <FiCheck className="w-4 h-4 text-green-700" />;
      case 'order_rejected':
        return <FiXCircle className="w-4 h-4 text-red-700" />;
      case 'order_cancelled':
        return <FiXCircle className="w-4 h-4 text-red-700" />;
      case 'order_recieved':
        return <FiPackage className="w-4 h-4 text-blue-700" />;
      default:
        return <FiUser className="w-4 h-4 text-purple-700" />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'product_created':
        return 'bg-blue-100';
      case 'product_approved':
        return 'bg-green-100';
      case 'product_rejected':
        return 'bg-red-100';
      case 'order_placed':
        return 'bg-blue-100';
      case 'order_accepted':
        return 'bg-green-100';
      case 'order_rejected':
        return 'bg-red-100';
      case 'order_cancelled':
        return 'bg-red-100';
      case 'order_recieved':
        return 'bg-blue-100';
      default:
        return 'bg-purple-100';
    }
  };

  // Get notification status text
  const getNotificationStatus = (type: string) => {
    switch (type) {
      case 'product_created':
        return 'PRODUCT CREATED';
      case 'product_approved':
        return 'PRODUCT APPROVED';
      case 'product_rejected':
        return 'PRODUCT REJECTED';
      case 'order_placed':
        return 'NEW ORDER';
      case 'order_accepted':
        return 'ORDER ACCEPTED';
      case 'order_rejected':
        return 'ORDER REJECTED';
      case 'order_cancelled':
        return 'ORDER CANCELLED';
      case 'order_recieved':
        return 'ORDER RECIEVED';
      default:
        return 'NEW CUSTOMER';
    }
  };

  // Get notification title based on type
  const getNotificationTitle = (type: string, title: string, created_at: string) => {
    // Use the actual title from the database if available
    if (title && title.trim() !== '') {
      return title;
    }
    
    // Fallback to type-based titles if no custom title
    switch (type) {
      case 'product_created':
        return 'New Product Added';
      case 'product_approved':
        return 'Product Approved';
      case 'product_rejected':
        return 'Product Rejected';
      case 'order_placed':
        return 'New Order Received';
      case 'order_accepted':
        return 'Order Accepted';
      case 'order_rejected':
        return 'Order Rejected';
      case 'order_cancelled':
        return 'Order Cancelled';
      case 'order_recieved':
        return 'New Order Received';
      default:
        return 'New Notification';
    }
  };



  // Get notification message based on type
  const getNotificationMessage = (type: string, message: string) => {
    // Use the actual message from the database if available
    if (message && message.trim() !== '') {
      return message;
    }
    
    // Fallback to type-based messages if no custom message
    switch (type) {
      case 'product_created':
        return 'A new product has been created successfully';
      case 'product_approved':
        return 'Your product has been approved';
      case 'product_rejected':
        return 'Your product has been rejected';
      case 'order_placed':
        return 'A new order was received. Please review and accept or reject.';
      case 'order_accepted':
        return 'Order has been accepted and is being processed';
      case 'order_rejected':
        return 'Order has been rejected and cancelled';
      case 'order_cancelled':
        return 'Order has been cancelled';
      case 'order_recieved':
        return 'A new order was received';
      default:
        return 'New notification received';
    }
  };

  // Get action button color based on type
  const getActionButtonColor = (type: string) => {
    switch (type) {
      case 'product_created':
        return 'bg-blue-200 text-blue-900 border-blue-600';
      case 'product_approved':
        return 'bg-green-200 text-green-900 border-green-600';
      case 'product_rejected':
        return 'bg-red-200 text-red-900 border-red-600';
      case 'order_placed':
        return 'bg-blue-200 text-blue-900 border-blue-600';
      case 'order_accepted':
        return 'bg-green-200 text-green-900 border-green-600';
      case 'order_rejected':
        return 'bg-red-200 text-red-900 border-red-600';
      case 'order_recieved':
        return 'bg-blue-200 text-blue-900 border-blue-600';
      default:
        return 'bg-purple-200 text-purple-900 border-purple-600';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Parse metadata
  const parseMetadata = (metadata: string) => {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  };

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'read':
        return notifications.filter(n => n.is_read);
      case 'unread':
        return notifications.filter(n => !n.is_read);
      default:
        return notifications;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const notificationPanel = document.querySelector('[data-notification-panel]');
      const notificationBell = dropdownRef.current;
      
      // Only close if clicking outside both the bell button and the notification panel
      if (notificationPanel && !notificationPanel.contains(target) && 
          notificationBell && !notificationBell.contains(target)) {
        setIsOpen(false);
        setShowDetail(false);
        setSelectedNotification(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications on mount and when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, dealerId]);

  const filteredNotifications = getFilteredNotifications();
  const readCount = notifications.filter(n => n.is_read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300 hover:scale-110"
      >
        <FiBell className="w-5 h-5" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && createPortal(
        <div 
          className="fixed top-16 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[2147483647] max-h-[600px] overflow-hidden" 
          style={{ 
            right: isDesktop ? '400px' : '16px' 
          }} 
          data-notification-panel
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex-shrink-0 font-medium transition-all duration-200 flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  style={{
                    fontSize: '12px',
                    width: isDesktop ? 'auto' : '145px',
                    height: isDesktop ? 'auto' : '30px',
                    padding: isDesktop ? '6px 12px' : '0px',
                    borderRadius: isDesktop ? '8px' : '4px',
                    boxSizing: 'border-box',
                    minWidth: isDesktop ? 'auto' : '145px',
                    maxWidth: isDesktop ? 'auto' : '145px',
                    minHeight: isDesktop ? 'auto' : '30px',
                    maxHeight: isDesktop ? 'auto' : '30px'
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowDetail(false);
                  setSelectedNotification(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200"
              
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'all' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'unread' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab('read')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'read' 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Read ({readCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto bg-white">
            {loading ? (
              <div className="p-6 text-center text-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 font-medium">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-600">
                <FiBell className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="font-semibold">No {activeTab} notifications</p>
                <p className="text-sm text-gray-500">You&apos;re all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const metadata = notification.metadata ? parseMetadata(notification.metadata) : {};
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => {
                      // Mark as read if unread
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }

                      // If a navigation handler is provided, route to specific notification on the page
                      if (onNavigateToSpecificNotification) {
                        setIsOpen(false);
                        setShowDetail(false);
                        setSelectedNotification(null);
                        onNavigateToSpecificNotification(notification.id.toString());
                        return;
                      }

                      // Fallback: open inline detail modal inside dropdown
                      setSelectedNotification(notification);
                      setShowDetail(true);
                    }}
                    className={`p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer border-b border-gray-100 relative ${
                      !notification.is_read ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >


                    <div className="flex items-start space-x-3 relative">
                      {/* Close button - Top right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        disabled={loadingStates[notification.id]}
                        className={`absolute top-0 right-0 w-6 h-6 rounded-full transition-colors flex items-center justify-center ${
                          loadingStates[notification.id] 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                        }`}
                        style={{ marginTop: '-20px' }}
                      >
                        <FiX className="w-4 h-4 " />
                      </button>

                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Title Row */}
                        <div className="flex items-center mb-2">
                          <h4 className={`text-sm font-semibold truncate flex-1 ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {getNotificationTitle(notification.type, notification.title, notification.created_at)}
                          </h4>
                        </div>
                        
                        {/* Message Row - Show product name and quantity for order-related notifications */}
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {(() => {
                            if (['order_placed','order_cancelled','order_rejected','order_accepted'].includes(notification.type)) {
                              const meta: any = notification.metadata ? parseMetadata(notification.metadata) : {};
                              const items = Array.isArray(meta.items) ? meta.items : [];
                              // Prefer items[0] if present
                              if (items.length > 0) {
                                const first = items[0] || {};
                                const name = first.name || first.product_name || meta.product_name || (meta.product_data && meta.product_data.name) || 'Item';
                                const qty = first.quantity || first.qty || meta.quantity || meta.qauntity || 1;
                                const extra = items.length > 1 ? ` +${items.length - 1} more` : '';
                                return `${name} x ${qty}${extra}`;
                              }
                              // Otherwise try direct fields on metadata
                              const metaName = meta.product_name || (meta.product_data && meta.product_data.name);
                              const metaQty = meta.quantity || meta.qauntity;
                              if (metaName && metaQty) {
                                return `${metaName} x ${metaQty}`;
                              }
                              // Fallback
                              return getNotificationMessage(notification.type, notification.message);
                            }
                            return getNotificationMessage(notification.type, notification.message);
                          })()}
                        </p>
                        
                        {/* Single Line Row - Type, IDs */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                            {notification.type.replace('_', ' ').toUpperCase()}
                          </span>
                          {notification.product_id && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                              ID: {notification.product_id}
                            </span>
                          )}
                          {notification.order_id && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 whitespace-nowrap">
                              Order: {notification.order_id}
                            </span>
                          )}
                          {notification.is_read && (
                            <div 
                              className="inline-flex items-center justify-center bg-green-100 rounded-full"
                              style={{
                                width: isDesktop ? '20px' : '16px',
                                height: isDesktop ? '20px' : '16px'
                              }}
                            >
                              <svg 
                                className="text-green-600" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                                style={{
                                  width: isDesktop ? '12px' : '10px',
                                  height: isDesktop ? '12px' : '10px'
                                }}
                              >
                                <path d="M18 6 7 17l-5-5"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2 items-center">
                          {/* Accept/Reject buttons for order_placed notifications */}
                          {notification.type === 'order_placed' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  acceptOrder(notification.id);
                                }}
                                disabled={acceptRejectLoading[notification.id]?.accept || acceptRejectLoading[notification.id]?.reject}
                                className={`flex-shrink-0 font-medium transition-all duration-200 flex items-center justify-center ${
                                  acceptRejectLoading[notification.id]?.accept
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md'
                                }`}
                                style={{
                                  fontSize: '12px',
                                  width: isDesktop ? 'auto' : '145px',
                                  height: isDesktop ? 'auto' : '30px',
                                  padding: isDesktop ? '6px 12px' : '0px',
                                  borderRadius: isDesktop ? '8px' : '4px',
                                  boxSizing: 'border-box',
                                  minWidth: isDesktop ? 'auto' : '145px',
                                  maxWidth: isDesktop ? 'auto' : '145px',
                                  minHeight: isDesktop ? 'auto' : '30px',
                                  maxHeight: isDesktop ? 'auto' : '30px'
                                }}
                              >
                                {acceptRejectLoading[notification.id]?.accept ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                    Accepting...
                                  </>
                                ) : (
                                  'Accept'
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  rejectOrder(notification.id);
                                }}
                                disabled={acceptRejectLoading[notification.id]?.accept || acceptRejectLoading[notification.id]?.reject}
                                className={`flex-shrink-0 font-medium transition-all duration-200 flex items-center justify-center ${
                                  acceptRejectLoading[notification.id]?.reject
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md'
                                }`}
                                style={{
                                  fontSize: '12px',
                                  width: isDesktop ? 'auto' : '145px',
                                  height: isDesktop ? 'auto' : '30px',
                                  padding: isDesktop ? '6px 12px' : '0px',
                                  borderRadius: isDesktop ? '8px' : '4px',
                                  boxSizing: 'border-box',
                                  minWidth: isDesktop ? 'auto' : '145px',
                                  maxWidth: isDesktop ? 'auto' : '145px',
                                  minHeight: isDesktop ? 'auto' : '30px',
                                  maxHeight: isDesktop ? 'auto' : '30px'
                                }}
                              >
                                {acceptRejectLoading[notification.id]?.reject ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                    Rejecting...
                                  </>
                                ) : (
                                  'Reject'
                                )}
                              </button>
                            </>
                          )}
                          
                          {/* Regular action buttons for other notifications */}
                          {notification.type !== 'order_placed' && (
                            <>
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  disabled={loadingStates[notification.id]}
                                  className={`flex-shrink-0 font-medium transition-all duration-200 flex items-center justify-center ${
                                    loadingStates[notification.id]
                                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                                  }`}
                                  style={{
                                    fontSize: '12px',
                                    width: isDesktop ? 'auto' : '145px',
                                    height: isDesktop ? 'auto' : '30px',
                                    padding: isDesktop ? '6px 12px' : '0px',
                                    borderRadius: isDesktop ? '8px' : '4px',
                                    boxSizing: 'border-box',
                                    minWidth: isDesktop ? 'auto' : '145px',
                                    maxWidth: isDesktop ? 'auto' : '145px',
                                    minHeight: isDesktop ? 'auto' : '30px',
                                    maxHeight: isDesktop ? 'auto' : '30px'
                                  }}
                                >
                                  Mark as read
                                </button>
                              )}
                              {onNavigateToSpecificNotification && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    onNavigateToSpecificNotification(notification.id.toString());
                                  }}
                                  className="flex-shrink-0 font-medium transition-all duration-200 flex items-center justify-center bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md"
                                  style={{
                                    fontSize: '12px',
                                    width: isDesktop ? 'auto' : '145px',
                                    height: isDesktop ? 'auto' : '30px',
                                    padding: isDesktop ? '6px 12px' : '0px',
                                    borderRadius: isDesktop ? '8px' : '4px',
                                    boxSizing: 'border-box',
                                    minWidth: isDesktop ? 'auto' : '145px',
                                    maxWidth: isDesktop ? 'auto' : '145px',
                                    minHeight: isDesktop ? 'auto' : '30px',
                                    maxHeight: isDesktop ? 'auto' : '30px'
                                  }}
                                >
                                  View Details
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium">Auto-refresh every 30s</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchNotifications}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors duration-200 hover:bg-blue-50 px-2 py-1 rounded"
                  >
                    <FiRefreshCw className="w-3 h-3 mr-1" />
                    Refresh now
                  </button>
                  {onNavigateToNotifications && (
                 <button
                   onClick={() => {
                     setIsOpen(false);
                     onNavigateToNotifications();
                     // Ensure notifications list is up to date when navigating via footer button
                     setTimeout(() => fetchNotifications(), 0);
                   }}
                      className="text-green-600 hover:text-green-800 font-medium flex items-center transition-colors duration-200 hover:bg-green-50 px-2 py-1 rounded"
                    >
                      <FiEye className="w-3 h-3 mr-1" />
                      View All
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Notification Detail Modal */}
      {showDetail && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2147483647]">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto border border-gray-100">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${getNotificationColor(selectedNotification.type)}`}>
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {getNotificationStatus(selectedNotification.type)}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      {formatDate(selectedNotification.created_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedNotification(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {getNotificationTitle(selectedNotification.type, selectedNotification.title, selectedNotification.created_at)}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {formatDate(selectedNotification.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {getNotificationMessage(selectedNotification.type, selectedNotification.message)}
                  </p>
                </div>

                {/* Metadata */}
                {selectedNotification.metadata && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h5 className="font-semibold text-gray-900 mb-3">Details</h5>
                    <div className="space-y-2 text-sm">
                      {Object.entries(parseMetadata(selectedNotification.metadata)).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center py-1">
                          <span className="text-gray-600 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="text-gray-900 font-semibold">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* IDs */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <h5 className="font-semibold text-gray-900 mb-3">Reference IDs</h5>
                  <div className="space-y-2 text-sm">
                    {selectedNotification.product_id && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium">Product ID:</span>
                        <span className="text-blue-600 font-mono font-semibold">{selectedNotification.product_id}</span>
                      </div>
                    )}
                    {selectedNotification.order_id && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium">Order ID:</span>
                        <span className="text-purple-600 font-mono font-semibold">{selectedNotification.order_id}</span>
                      </div>
                    )}
                    {selectedNotification.dealer_id && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 font-medium">Dealer ID:</span>
                        <span className="text-green-600 font-mono font-semibold">{selectedNotification.dealer_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => removeNotification(selectedNotification.id)}
                  className="flex items-center text-red-600 hover:text-red-800 font-medium transition-colors duration-200"
                >
                  <FiTrash2 className="w-4 h-4 mr-2" />
                  Remove Notification
                </button>
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedNotification(null);
                  }}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 