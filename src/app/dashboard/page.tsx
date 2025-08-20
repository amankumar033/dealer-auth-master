'use client';

import { useState, useEffect } from 'react';
import { FiHome, FiPackage, FiUser, FiGrid, FiTag, FiLogOut, FiMenu, FiX, FiBell, FiRefreshCw } from 'react-icons/fi';
import ProductList from '../components/dashboard-components/ProductList';
import ProductForm from '../components/dashboard-components/ProductForm';
import CategoryManager from '../components/dashboard-components/CategoryManager';
import OrdersManager from '../components/dashboard-components/OrdersManager';
import { Product, CreateProductRequest, UpdateProductRequest, Order, Category } from '@/types/database';
import { productApi } from '@/lib/api';
import { useDealer } from '@/contexts/DealerContext';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/app/components/ui/ToastContainer';
import LoadingButton from '@/app/components/ui/LoadingButton';
import WavingDots from '@/app/components/ui/WavingDots';
import NotificationBell from '@/app/components/ui/NotificationBell';
import CustomDropdown from '@/app/components/ui/CustomDropdown';



export default function DealerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [hoveredNotificationId, setHoveredNotificationId] = useState<string | null>(null);
  const [openedNotificationId, setOpenedNotificationId] = useState<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [acceptRejectLoading, setAcceptRejectLoading] = useState<{ [key: number]: { accept: boolean; reject: boolean } }>({});
  const [notificationSearch, setNotificationSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [readFilter, setReadFilter] = useState<'All' | 'Unread' | 'Read'>('All');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [categoryProductsLoading, setCategoryProductsLoading] = useState(false);
  
  const { dealer, logout } = useDealer();
  const { showSuccess, showError } = useToast();
  const dealerId = dealer?.dealer_id || 'DLR006'; // Use DLR006 which has 25 products
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Handle category click to show products
  const handleCategoryClick = async (category: Category) => {
    try {
      setSelectedCategory(category);
      setCategoryProductsLoading(true);
      setActiveTab('products'); // Switch to products tab
      
      // Fetch products for this category
      const response = await fetch(`/api/products?category_id=${category.category_id}&dealer_id=${dealerId}`);
      if (response.ok) {
        const data = await response.json();
        setCategoryProducts(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch category products:', response.status);
        setCategoryProducts([]);
        showError('Failed to load category products', 'Please try again.');
      }
    } catch (error) {
      console.error('Error fetching category products:', error);
      setCategoryProducts([]);
      showError('Failed to load category products', 'Please check your connection and try again.');
    } finally {
      setCategoryProductsLoading(false);
    }
  };

  // Handle back to categories
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCategoryProducts([]);
    setActiveTab('categories');
  };
  

  
  console.log('Dashboard: Current dealer:', dealer);
  console.log('Dashboard: Using dealerId:', dealerId);
  
  // Debug: Check if dealer is properly set
  if (!dealer) {
    console.warn('⚠️ No dealer found in context - using fallback dealerId:', dealerId);
  } else {
    console.log('✅ Dealer found in context:', dealer.dealer_id);
  }

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

  // Fetch orders data
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true);
        const response = await fetch(`/api/orders?dealer_id=${dealerId}`);
        if (response.ok) {
          const data = await response.json();
          // Ensure data is an array
          setOrders(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch orders:', response.status);
          setOrders([]);
          showError('Failed to load orders', 'Please refresh the page to try again.');
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
        showError('Failed to load orders', 'Please check your connection and try again.');
      } finally {
        setOrdersLoading(false);
      }
    };

    if (dealerId) {
      fetchOrders();
    }
  }, [dealerId, showError]);

  // Manual refresh helper for orders state (used after accept/reject)
  const refreshOrders = async () => {
    try {
      const response = await fetch(`/api/orders?dealer_id=${dealerId}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
  };

  // Fetch products data
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await fetch(`/api/products?dealer_id=${dealerId}`);
        if (response.ok) {
          const data = await response.json();
          // Ensure data is an array
          setProducts(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch products:', response.status);
          setProducts([]);
          showError('Failed to load products', 'Please refresh the page to try again.');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        showError('Failed to load products', 'Please check your connection and try again.');
      } finally {
        setProductsLoading(false);
      }
    };

    if (dealerId) {
      fetchProducts();
    }

    // Add event listener for product updates
    const handleProductsUpdate = () => {
      if (dealerId) {
        fetchProducts();
      }
    };

    window.addEventListener('products-updated', handleProductsUpdate);

    // Cleanup event listener
    return () => {
      window.removeEventListener('products-updated', handleProductsUpdate);
    };
  }, [dealerId, showError]);

  // Fetch categories data
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch(`/api/categories?show_all=true`);
        if (response.ok) {
          const data = await response.json();
          // Ensure data is an array
          setCategories(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to fetch categories:', response.status);
          setCategories([]);
          showError('Failed to load categories', 'Please refresh the page to try again.');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
        showError('Failed to load categories', 'Please check your connection and try again.');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [showError]);

  // Fetch notifications (reusable)
  const fetchNotificationsData = async () => {
      try {
        setNotificationsLoading(true);
      const response = await fetch(`/api/notifications?dealer_id=${dealerId}&limit=50`);
        if (response.ok) {
          const data = await response.json();
        const notificationsData = data.notifications || data;
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
        } else {
          console.error('Failed to fetch notifications:', response.status);
          setNotifications([]);
          showError('Failed to load notifications', 'Please refresh the page to try again.');
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
        showError('Failed to load notifications', 'Please check your connection and try again.');
      } finally {
        setNotificationsLoading(false);
      }
    };

  // Initial notifications load
  useEffect(() => {
    if (dealerId) {
      fetchNotificationsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealerId]);

  // Ensure data is loaded when opening Notifications tab
  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotificationsData();

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Close mobile menu when tab changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Clear selected notification when tab changes
  useEffect(() => {
    setSelectedNotification(null);
    setHoveredNotificationId(null);
  }, [activeTab]);

  // Clear selected notification when notifications are refreshed
  useEffect(() => {
    setSelectedNotification(null);
    setHoveredNotificationId(null);
  }, [notifications]);

  // Derived lists for filters
  const availableNotificationTypes = Array.from(new Set((notifications || []).map(n => n.type))).sort();
  const filteredNotifications = (notifications || []).filter(n => {
    const query = notificationSearch.trim().toLowerCase();
    const matchesSearch = query === '' || [n.title, n.message, n.order_id, n.product_id]
      .some((field: any) => String(field || '').toLowerCase().includes(query));
    const matchesType = typeFilter === 'All' || n.type === typeFilter;
    const matchesRead = readFilter === 'All' || (readFilter === 'Unread' ? !n.is_read : !!n.is_read);
    return matchesSearch && matchesType && matchesRead;
  });





  // Product management functions
  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
    setActiveTab('products'); // Switch to products tab when adding a product
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      console.log('🗑️ Attempting to delete product:', productId, 'for dealer:', dealerId);
      await productApi.delete(productId, dealerId);
      console.log('✅ Product deleted successfully');
    } catch (error: any) {
      console.error('❌ Failed to delete product:', error);
      
      // Check if the error message indicates the product was actually deleted
      if (error.message && error.message.includes('Product not found')) {
        console.log('🔄 Product not found - it may have been deleted successfully');
        return; // Don't throw error, treat as success
      } else {
        throw error; // Re-throw other errors
      }
    }
  };

  const handleProductSubmit = async (data: CreateProductRequest | UpdateProductRequest) => {
    try {
      setIsSubmitting(true);
      if (editingProduct) {
        await productApi.update(editingProduct.product_id.toString(), data as UpdateProductRequest);
      } else {
        await productApi.create(data as CreateProductRequest);
      }
      setShowProductForm(false);
      setEditingProduct(null);
      
      // Refresh products list after successful submission
      // This will trigger the useEffect that fetches products
      const event = new Event('products-updated');
      window.dispatchEvent(event);
      
      // Show success message
      const message = editingProduct ? 'Product updated successfully!' : 'Product created successfully!';
      showSuccess(message);
    } catch (error) {
      console.error('Failed to save product:', error);
      showError('Failed to save product', 'Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };



  // Delete notification
  const handleDeleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
        showSuccess('Notification deleted successfully');
      } else {
        showError('Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      showError('Failed to delete notification');
    }
  };

  // Accept order via notification (on Notifications page)
  const acceptOrderNotification = async (notificationId: number) => {
    try {
      setAcceptRejectLoading(prev => ({ 
        ...prev, 
        [notificationId]: { ...(prev[notificationId] || { accept: false, reject: false }), accept: true } 
      }));
      const response = await fetch(`/api/notifications/${notificationId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealer_id: dealerId })
      });
      if (!response.ok) {
        try {
          const err = await response.json();
          showError('Failed to accept order', err.error || '');
        } catch {
          showError('Failed to accept order');
        }
        return;
      }
      await fetchNotificationsData();
      await refreshOrders();
      showSuccess('Order accepted');
    } catch (error) {
      console.error('Error accepting order:', error);
      showError('Failed to accept order');
    } finally {
      setAcceptRejectLoading(prev => ({ 
        ...prev, 
        [notificationId]: { ...(prev[notificationId] || { accept: false, reject: false }), accept: false } 
      }));
    }
  };

  // Reject order via notification (on Notifications page)
  const rejectOrderNotification = async (notificationId: number) => {
    try {
      setAcceptRejectLoading(prev => ({ 
        ...prev, 
        [notificationId]: { ...(prev[notificationId] || { accept: false, reject: false }), reject: true } 
      }));
      const response = await fetch(`/api/notifications/${notificationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealer_id: dealerId })
      });
      if (!response.ok) {
        try {
          const err = await response.json();
          showError('Failed to reject order', err.error || '');
        } catch {
          showError('Failed to reject order');
        }
        return;
      }
      await fetchNotificationsData();
      await refreshOrders();
      showSuccess('Order rejected');
    } catch (error) {
      console.error('Error rejecting order:', error);
      showError('Failed to reject order');
    } finally {
      setAcceptRejectLoading(prev => ({ 
        ...prev, 
        [notificationId]: { ...(prev[notificationId] || { accept: false, reject: false }), reject: false } 
      }));
    }
  };



  // Mark notification as read
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, isRead: true })
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.notification_id === notificationId ? { ...n, is_read: 1 } : n)
        );
        showSuccess('Notification marked as read');
      } else {
        showError('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showError('Failed to mark notification as read');
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      showSuccess('Logged out successfully');
    } catch (error) {
      showError('Logout failed', 'Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-white shadow-lg transform transition-all duration-500 ease-out lg:relative lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 sm:p-6 pb-[7px] border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AutoParts Pro</h1>
              <p className="text-sm sm:text-base text-gray-700">Dealer Dashboard</p>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-all duration-300 hover:scale-110"
            >
              <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </button>
          </div>
        </div>
        <nav className="p-4 sm:p-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center w-full p-3 sm:p-4 rounded-xl mb-3 text-base sm:text-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg ${
              activeTab === 'dashboard' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' 
                : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 text-gray-700 hover:text-blue-600'
            }`}
          >
            <FiHome className="mr-3 sm:mr-4 w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center w-full p-3 sm:p-4 rounded-xl mb-3 text-base sm:text-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg ${
              activeTab === 'services' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' 
                : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 text-gray-700 hover:text-blue-600'
            }`}
          >
            <FiPackage className="mr-3 sm:mr-4 w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center w-full p-3 sm:p-4 rounded-xl mb-3 text-base sm:text-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg ${
              activeTab === 'products' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' 
                : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 text-gray-700 hover:text-blue-600'
            }`}
          >
            <FiGrid className="mr-3 sm:mr-4 w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center w-full p-3 sm:p-4 rounded-xl mb-3 text-base sm:text-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg ${
              activeTab === 'categories' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' 
                : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 text-gray-700 hover:text-blue-600'
            }`}
          >
            <FiTag className="mr-3 sm:mr-4 w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center w-full p-3 sm:p-4 rounded-xl mb-3 text-base sm:text-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg ${
              activeTab === 'notifications' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' 
                : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 text-gray-700 hover:text-blue-600'
            }`}
          >
            <FiBell className="mr-3 sm:mr-4 w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110" />
            Notifications
          </button>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center w-full p-3 sm:p-4 rounded-xl text-base sm:text-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg ${
              activeTab === 'profile' 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' 
                : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 text-gray-700 hover:text-blue-600'
            }`}
          >
            <FiUser className="mr-3 sm:mr-4 w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:scale-110" />
            Profile
          </button>
        </nav>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-lg p-3 sm:p-4 pb-[30px] flex justify-between items-center backdrop-blur-sm bg-white/95">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-all duration-300 hover:scale-110"
            >
              <FiMenu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'services' && 'Orders'}
              {activeTab === 'products' && 'Products'}
              {activeTab === 'categories' && 'Categories'}
              {activeTab === 'notifications' && 'Notifications'}
              {activeTab === 'profile' && 'Profile'}
            </h2>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            {/* Search - Hidden on mobile */}
            <div className="hidden md:block relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 text-gray-500 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:shadow-md focus:shadow-lg"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            

            
            {/* Dealer Info and Logout */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
              {/* Notification Bell */}
              <NotificationBell 
                dealerId={dealerId} 
                onNavigateToNotifications={() => setActiveTab('notifications')}
                onNavigateToSpecificNotification={(id: string) => {
                  // Switch to notifications tab first
                  setActiveTab('notifications');
                  // Open the clicked notification's details
                  setOpenedNotificationId(id);
                  // Give the tab a tick to render, then scroll to the target
                  setTimeout(() => {
                    const target = document.getElementById(`notification-${id}`);
                    if (target) {
                      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      target.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2');
                      setTimeout(() => {
                        target.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2');
                      }, 2000);
                    }
                  }, 100);
                }}
              />
              
              {/* Dealer info - Hidden on mobile */}
              <div className="hidden md:block text-right">
                <p className="text-sm text-gray-700">{dealer?.name || 'Dealer'}</p>
                <p className="text-xs text-gray-500">{dealer?.email || 'dealer@example.com'}</p>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm lg:text-base transition-all duration-300 hover:scale-110 hover:shadow-lg">
                {dealer?.name ? dealer.name.charAt(0).toUpperCase() : 'D'}
              </div>
              <LoadingButton
                onClick={handleLogout}
                loading={isLoggingOut}
                variant="secondary"
                size="sm"
                className="flex items-center px-1.5 py-1.5 sm:px-2 sm:py-2 lg:px-3 lg:py-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-300 hover:scale-105 hover:shadow-md"
                loadingText="Logging out..."
              >
                <FiLogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </LoadingButton>
            </div>
          </div>
        </header>



        {/* Dashboard Content */}
        <main className="p-4 lg:p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-4 lg:space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-lg transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-100 border border-transparent hover:border-purple-200 dashboard-card-hover">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-700 text-xs sm:text-sm transition-colors duration-300">Total Orders</p>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 text-black transition-colors duration-300">
                        {ordersLoading ? <WavingDots size="sm" color="#6b7280" /> : (orders || []).length}
                      </h3>
                    </div>
                    <div className="p-1.5 sm:p-2 lg:p-3 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 transition-all duration-300 hover:scale-110 hover:shadow-lg">
                      <FiPackage className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-transform duration-300 hover:rotate-12" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 transition-colors duration-300">
                    <span className="text-purple-600 font-medium">All time orders</span>
                  </p>
                </div>

                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-lg transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-100 border border-transparent hover:border-orange-200 dashboard-card-hover">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-700 text-xs sm:text-sm transition-colors duration-300">Pending Orders</p>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 text-black transition-colors duration-300">
                        {ordersLoading ? <WavingDots size="sm" color="#6b7280" /> : (orders || []).filter(r => r.order_status === 'Pending').length}
                      </h3>
                    </div>
                    <div className="p-1.5 sm:p-2 lg:p-3 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 transition-all duration-300 hover:scale-110 hover:shadow-lg">
                      <FiPackage className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-transform duration-300 hover:rotate-12" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 transition-colors duration-300">
                    <span className="text-orange-600 font-medium">Awaiting processing</span>
                  </p>
                </div>

                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-lg transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-100 border border-transparent hover:border-green-200 dashboard-card-hover">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-700 text-xs sm:text-sm transition-colors duration-300">Total Products</p>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 text-black transition-colors duration-300">
                        {productsLoading ? <WavingDots size="sm" color="#6b7280" /> : (products || []).length}
                      </h3>
                    </div>
                    <div className="p-1.5 sm:p-2 lg:p-3 rounded-xl bg-gradient-to-br from-green-100 to-green-200 text-green-600 transition-all duration-300 hover:scale-110 hover:shadow-lg">
                      <FiGrid className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-transform duration-300 hover:rotate-12" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 transition-colors duration-300">
                    <span className="text-green-600 font-medium">Active listings</span>
                  </p>
                </div>

                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-lg transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-100 border border-transparent hover:border-blue-200 dashboard-card-hover">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-700 text-xs sm:text-sm transition-colors duration-300">Categories</p>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 text-black transition-colors duration-300">
                        {categoriesLoading ? <WavingDots size="sm" color="#6b7280" /> : (categories || []).length}
                      </h3>
                    </div>
                    <div className="p-1.5 sm:p-2 lg:p-3 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 transition-all duration-300 hover:scale-110 hover:shadow-lg">
                      <FiTag className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-transform duration-300 hover:rotate-12" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 transition-colors duration-300">
                    <span className="text-blue-600 font-medium">Product categories</span>
                  </p>
                </div>
              </div>

              {/* Recent Orders and Most Selling Products Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                {/* Recent Orders - Left Side */}
                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-3 sm:mb-4 lg:mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-black">Recent Orders</h3>
                  <button 
                    onClick={() => setActiveTab('services')}
                    className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ordersLoading ? (
                        <tr>
                          <td colSpan={6} className="px-3 lg:px-6 py-4 text-center text-gray-500">
                            <div className="flex items-center justify-center space-x-2">
                              <WavingDots size="md" color="#6b7280" />
                              <span>Loading orders...</span>
                            </div>
                          </td>
                        </tr>
                        ) : !Array.isArray(orders) || (orders || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 lg:px-6 py-4 text-center text-gray-500">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        (orders || []).slice(0, 5).map((order) => (
                          <tr key={order.order_id} className="dashboard-table-row cursor-pointer">
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{order.order_id}
                            </td>
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {safeRender(order.customer_name)}
                            </td>
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.order_date).toLocaleDateString()}
                            </td>
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {formatCurrency(order.total_amount)}
                            </td>
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  order.order_status === 'Completed'
                                    ? 'bg-green-100 text-green-800'
                                    : order.order_status === 'Processing'
                                    ? 'bg-blue-100 text-blue-800'
                                    : order.order_status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {order.order_status}
                              </span>
                            </td>
                            <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  order.payment_status === 'Paid'
                                    ? 'bg-green-100 text-green-800'
                                    : order.payment_status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : order.payment_status === 'Failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {order.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
              </div>

                {/* Most Selling Products - Right Side */}
           
              </div>
              <div className="bg-white p-4 lg:p-6 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-4 lg:mb-6">
                    <h3 className="text-lg font-bold text-black">Most Selling Products</h3>
                    <button 
                      onClick={() => setActiveTab('products')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {productsLoading ? (
                      <div className="text-center py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <WavingDots size="md" color="#6b7280" />
                          <span className="text-gray-500">Loading products...</span>
                        </div>
                      </div>
                    ) : !Array.isArray(products) || (products || []).length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No products found</p>
                      </div>
                    ) : (
                      (products || []).slice(0, 5).map((product) => {
                                                  const category = (categories || []).find(cat => cat.category_id === product.category_id);
                        return (
                          <div key={product.product_id} className="dashboard-product-item flex items-center justify-between p-3 lg:p-4 border rounded-lg cursor-pointer">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                <FiGrid className="w-4 h-4 lg:w-5 lg:h-5 text-gray-500" />
                              </div>
                          <div>
                                <h4 className="font-medium text-gray-900 text-sm lg:text-base">{safeRender(product.name)}</h4>
                                <p className="text-xs lg:text-sm text-gray-500">{category?.name || 'Unknown Category'}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="font-semibold text-gray-900 text-sm lg:text-base">{formatCurrency(product.sale_price)}</p>
                              <p className="text-xs lg:text-sm text-gray-500">{safeRender(product.stock_quantity)} in stock</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <OrdersManager userId={dealerId} />
          )}

          {activeTab === 'products' && (
            <div>
              {showProductForm ? (
                <ProductForm
                  product={editingProduct || undefined}
                  dealerId={dealerId}
                  onSubmit={handleProductSubmit}
                  onCancel={handleCancelProductForm}
                  isLoading={isSubmitting}
                />
              ) : (
                <ProductList
                  dealerId={dealerId}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onAdd={handleAddProduct}
                  categoryProducts={categoryProducts}
                  categoryProductsLoading={categoryProductsLoading}
                  selectedCategory={selectedCategory}
                  onBackToCategories={handleBackToCategories}
                />
              )}
            </div>
          )}

          {activeTab === 'categories' && (
                            <CategoryManager dealerId={dealerId} onCategoryClick={handleCategoryClick} />
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Header with Bell Icon */}
              <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiBell className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Notifications</h2>
                      <p className="text-sm lg:text-base text-gray-600">Manage and view all system notifications</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      onClick={() => {
                        // Refresh notifications
                        window.location.reload();
                      }}
                      className="px-3 lg:px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm lg:text-base"
                    >
                      <FiRefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>

                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Card */}
                <div className="bg-gradient-to-r from-blue-50 to-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {notificationsLoading ? '...' : notifications.length}
                      </p>
                    </div>
                    <FiBell className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                {/* Unread Card */}
                <div className="bg-gradient-to-r from-red-50 to-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Unread</p>
                      <p className="text-2xl font-bold text-red-600">
                        {notificationsLoading ? '...' : notifications.filter(n => !n.is_read).length}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Read Card */}
                <div className="bg-gradient-to-r from-green-50 to-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Read</p>
                      <p className="text-2xl font-bold text-green-600">
                        {notificationsLoading ? '...' : notifications.filter(n => n.is_read).length}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Filtered Card */}
                <div className="bg-gradient-to-r from-purple-50 to-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Filtered</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {notificationsLoading ? '...' : filteredNotifications.length}
                      </p>
                    </div>
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Search and Filter Section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={notificationSearch}
                      onChange={(e) => setNotificationSearch(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 text-gray-600 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:flex md:space-x-2 gap-2 md:gap-0">
                    <CustomDropdown
                      options={[
                        { value: 'All', label: 'All Types' },
                        ...availableNotificationTypes.map(t => ({
                          value: t,
                          label: t.replace(/_/g, ' ')
                        }))
                      ]}
                      value={typeFilter}
                      onChange={setTypeFilter}
                      placeholder="Select type"
                      maxHeight="max-h-48"
                      className="text-sm"
                    />
                    
                    <CustomDropdown
                      options={[
                        { value: 'All', label: 'All Status' },
                        { value: 'Unread', label: 'Unread' },
                        { value: 'Read', label: 'Read' }
                      ]}
                      value={readFilter}
                      onChange={(value) => setReadFilter(value as 'All' | 'Unread' | 'Read')}
                      placeholder="Select status"
                      maxHeight="max-h-48"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {notificationsLoading ? (
                  <div className="p-8 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <WavingDots size="lg" color="#6b7280" />
                      <span className="text-gray-500">Loading notifications...</span>
                    </div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <FiBell className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
                    <p className="text-gray-500">You'll see notifications here when they arrive</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredNotifications.map((notification, index) => (
                      <div
                        key={notification.notification_id || index}
                        id={`notification-${notification.notification_id || notification.id || index}`}
                        className="group relative p-6 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          const idStr = (notification.notification_id?.toString() || notification.id?.toString() || index.toString());
                          setOpenedNotificationId(openedNotificationId === idStr ? null : idStr);
                        }}
                      >
                        <div className="flex items-start space-x-4">
                          
                          {/* Info Icon */}
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {notification.title || 'New Order Created'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(notification.created_at).toLocaleDateString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                hour12: false
                              })}
                            </p>
                            {notification.message && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                            )}
                          </div>

                          {/* Right Side */}
                          <div className="flex flex-col items-end space-y-2">
                            <p className="text-sm text-gray-500">
                              {formatRelativeTime(notification.created_at)}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.notification_id || notification.id);
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                          {/* Order details (toggle visible on click) for order_placed / orders_placed */}
                          {(notification.type === 'order_placed' || notification.type === 'orders_placed') && openedNotificationId === (notification.notification_id?.toString() || notification.id?.toString() || index.toString()) && (
                          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                            {(() => {
                              let meta: any = {};
                              try {
                                meta = typeof notification.metadata === 'string' ? JSON.parse(notification.metadata) : (notification.metadata || {});
                              } catch {
                                meta = {};
                              }
                              const orderId = meta.order_id || meta.primary_order_id || notification.order_id || '-';
                              const orderDate = meta.order_date ? new Date(meta.order_date).toLocaleString('en-IN') : (notification.created_at ? new Date(notification.created_at).toLocaleString('en-IN') : '-');
                              const status = meta.order_status || '-';
                              const payment = meta.payment_status || '-';
                              const total = meta.total_amount != null ? formatCurrency(meta.total_amount) : '-';
                              const customerName = meta.customer_name || '-';
                              const customerEmail = meta.customer_email || '-';
                              const address = meta.shipping_address || '-';
                              const pincode = meta.shipping_pincode || '-';
                              const items = Array.isArray(meta.items) ? meta.items : [];
                              const multiOrders = Array.isArray(meta.order_ids) ? meta.order_ids : [];
                              const displayOrderIds = (multiOrders.length > 0) ? multiOrders : (orderId && orderId !== '-' ? [orderId] : []);
                              const shownKeys = new Set([
                                'items','order_id','orderId','order_date','orderDate','order_status','orderStatus','total_amount','totalAmount','customer_name','customerName','customer_email','customerEmail','payment_status','paymentStatus','shipping_address','shippingAddress','shipping_pincode','shippingPincode',
                                // hide meta-only helper fields
                                'order_ids','primary_order_id','dealer_details','product_details','is_multiple_orders','is_multiple_products','total_orders','totalOrders','total_items','totalItems','product_ids','productIds'
                              ]);
                              const otherEntries = Object.entries(meta).filter(([k]) => !shownKeys.has(k));
                                return (
                                <div className="space-y-5">
                                  {/* Order Summary */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Order ID</p>
                                      <div className="flex flex-wrap gap-1 text-gray-600">
                                        {displayOrderIds.length === 0 ? (
                                          <span className="font-semibold">-</span>
                                        ) : (
                                          displayOrderIds.map((oid: string) => (
                                            <span key={oid} className="text-sm font-medium">{oid}</span>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Date</p>
                                      <p className="font-semibold text-gray-900">{orderDate}</p>
                                          </div>
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Total</p>
                                      <p className="font-semibold text-gray-900">{total}</p>
                                          </div>
                                          </div>
                                  {/* Payment only (status moved per-item) */}
                                  <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Payment</p>
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{payment}</span>
                                          </div>
                                        </div>
                                  {/* Customer & Shipping */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Customer</p>
                                      <p className="font-semibold text-gray-900">{customerName}</p>
                                      <p className="text-sm text-gray-600">{customerEmail}</p>
                                          </div>
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Shipping</p>
                                      <p className="font-semibold text-gray-900">{address}</p>
                                      <p className="text-sm text-gray-600">Pincode: {pincode}</p>
                                          </div>
                                          </div>
                                  {items.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <h5 className="text-sm font-semibold text-gray-800 mb-2">Items</h5>
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                          <thead>
                                            <tr className="text-left text-gray-500">
                                              <th className="py-1 pr-4">Name</th>
                                              <th className="py-1 pr-4">Order ID</th>
                                              <th className="py-1 pr-4">Status</th>
                                              <th className="py-1 pr-4">Qty</th>
                                              <th className="py-1 pr-4">Price</th>
                                              <th className="py-1 pr-4">Subtotal</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {items.map((it: any, idx: number) => {
                                              const orderIdForItem = (multiOrders[idx] || orderId);
                                              const matchingOrder = orders.find(o => {
                                                if (!o) return false;
                                                if (orderIdForItem && o.order_id !== orderIdForItem) return false;
                                                if (it.product_id) return o.product_id === it.product_id;
                                                return true;
                                              });
                                              const statusForItem = matchingOrder ? matchingOrder.order_status : '-';
                                              return (
                                                <tr key={idx} className="text-gray-800">
                                                  <td className="py-1 pr-4">{it.name || it.product_name || '-'}</td>
                                                  <td className="py-1 pr-4 font-mono text-xs">{orderIdForItem || '-'}</td>
                                                  <td className="py-1 pr-4">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${String(statusForItem).toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' : String(statusForItem).toLowerCase() === 'processing' ? 'bg-blue-100 text-blue-800' : String(statusForItem).toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                      {statusForItem || '-'}
                                                    </span>
                                                  </td>
                                                  <td className="py-1 pr-4">{it.quantity || it.qty || '-'}</td>
                                                  <td className="py-1 pr-4">{it.price != null ? formatCurrency(it.price) : '-'}</td>
                                                  <td className="py-1 pr-4">{it.subtotal != null ? formatCurrency(it.subtotal) : (it.price != null && it.quantity != null ? formatCurrency(Number(it.price) * Number(it.quantity)) : '-')}</td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                        </div>
                                          </div>
                                        )}


                                  {/* Single Approve/Reject for all orders */}
                                  <div className="flex space-x-2 pt-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                        acceptOrderNotification(notification.notification_id || notification.id);
                                        }}
                                      disabled={acceptRejectLoading[notification.notification_id || notification.id]?.accept || acceptRejectLoading[notification.notification_id || notification.id]?.reject}
                                      className={`px-3 py-1.5 rounded text-sm font-medium ${acceptRejectLoading[notification.notification_id || notification.id]?.accept ? 'bg-gray-200 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                      >
                                      {acceptRejectLoading[notification.notification_id || notification.id]?.accept ? 'Accepting...' : 'Accept'}
                                      </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                        rejectOrderNotification(notification.notification_id || notification.id);
                                          }}
                                      disabled={acceptRejectLoading[notification.notification_id || notification.id]?.accept || acceptRejectLoading[notification.notification_id || notification.id]?.reject}
                                      className={`px-3 py-1.5 rounded text-sm font-medium ${acceptRejectLoading[notification.notification_id || notification.id]?.reject ? 'bg-gray-200 text-gray-500' : 'bg-red-600 text-white hover:bg-red-700'}`}
                                        >
                                      {acceptRejectLoading[notification.notification_id || notification.id]?.reject ? 'Rejecting...' : 'Reject'}
                                        </button>
                                    </div>
                                  </div>
                                );
                            })()}
                          </div>
                        )}

                        {/* Toggle details for order_rejected / order_accepted / order_cancelled / order_approved */}
                        {(['order_rejected','order_accepted','order_cancelled','order_approved'].includes(notification.type)) && openedNotificationId === (notification.notification_id?.toString() || notification.id?.toString() || index.toString()) && (
                          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                            {notification.description && (
                              <div className="mb-4 bg-gray-50 rounded-lg p-3 border">
                                <h5 className="text-sm font-semibold text-gray-800 mb-1">Description</h5>
                                <p className="text-sm text-gray-700">{notification.description}</p>
                              </div>
                            )}
                            {(() => {
                              let meta: any = {};
                              try {
                                meta = typeof notification.metadata === 'string' ? JSON.parse(notification.metadata) : (notification.metadata || {});
                              } catch {
                                meta = {};
                              }
                              const orderId = meta.order_id || notification.order_id || '-';
                              const orderDate = meta.order_date ? new Date(meta.order_date).toLocaleString('en-IN') : (notification.created_at ? new Date(notification.created_at).toLocaleString('en-IN') : '-');
                              const status = meta.order_status || '-';
                              const payment = meta.payment_status || '-';
                              const total = meta.total_amount != null ? formatCurrency(meta.total_amount) : '-';
                              const customerName = meta.customer_name || '-';
                              const customerEmail = meta.customer_email || '-';
                              const address = meta.shipping_address || '-';
                              const pincode = meta.shipping_pincode || '-';
                              const items = Array.isArray(meta.items) ? meta.items : [];
                               const shownKeys = new Set([
                                 'items','order_id','orderId','order_date','orderDate','order_status','orderStatus','total_amount','totalAmount','customer_name','customerName','customer_email','customerEmail','payment_status','paymentStatus','shipping_address','shippingAddress','shipping_pincode','shippingPincode',
                                 // hide meta-only helper fields
                                 'order_ids','primary_order_id','dealer_details','product_details','is_multiple_orders','is_multiple_products','total_orders','totalOrders','total_items','totalItems','product_ids','productIds'
                               ]);
                              const otherEntries = Object.entries(meta).filter(([k]) => !shownKeys.has(k));
                                return (
                                <div className="space-y-5">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Order ID</p>
                                      <p className="font-semibold text-gray-900">{orderId}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Date</p>
                                      <p className="font-semibold text-gray-900">{orderDate}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Total</p>
                                      <p className="font-semibold text-gray-900">{total}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Status</p>
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{status}</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Payment</p>
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{payment}</span>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Customer</p>
                                      <p className="font-semibold text-gray-900">{customerName}</p>
                                      <p className="text-sm text-gray-600">{customerEmail}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <p className="text-xs text-gray-500">Shipping</p>
                                      <p className="font-semibold text-gray-900">{address}</p>
                                      <p className="text-sm text-gray-600">Pincode: {pincode}</p>
                                    </div>
                                  </div>
                                  {items.length > 0 && (
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                      <h5 className="text-sm font-semibold text-gray-800 mb-2">Items</h5>
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                          <thead>
                                            <tr className="text-left text-gray-500">
                                              <th className="py-1 pr-4">Name</th>
                                              <th className="py-1 pr-4">Qty</th>
                                              <th className="py-1 pr-4">Price</th>
                                              <th className="py-1 pr-4">Subtotal</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {items.map((it: any, idx: number) => (
                                              <tr key={idx} className="text-gray-800">
                                                <td className="py-1 pr-4">{it.name || it.product_name || '-'}</td>
                                                <td className="py-1 pr-4">{it.quantity || it.qty || '-'}</td>
                                                <td className="py-1 pr-4">{it.price != null ? formatCurrency(it.price) : '-'}</td>
                                                <td className="py-1 pr-4">{it.subtotal != null ? formatCurrency(it.subtotal) : (it.price != null && it.quantity != null ? formatCurrency(Number(it.price) * Number(it.quantity)) : '-')}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  </div>
                                );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-lg p-4 lg:p-6">
              <div className="flex justify-between items-center mb-4 lg:mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-black">Dealer Profile</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {safeRender(dealer?.business_name) || 'Not provided'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {safeRender(dealer?.name) || 'Not provided'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {safeRender(dealer?.email) || 'Not provided'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {safeRender(dealer?.business_address) || 'Not provided'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {safeRender(dealer?.pincode) || 'Not provided'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {safeRender(dealer?.phone) || 'Not provided'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        dealer?.is_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {dealer?.is_verified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {dealer?.created_at ? new Date(dealer.created_at).toLocaleDateString() : 'Not available'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dealer ID</label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      #{dealer?.dealer_id || 'Not available'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          
          {/* Quick Action Cards - Only shown on dashboard tab */}
          {activeTab === 'dashboard' && (
            <div className="mt-8 lg:mt-12">
              <div className="flex items-center justify-between mb-6 lg:mb-8">
                <div>
                  <h3 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
                    Quick Actions
                  </h3>
                  <p className="text-sm lg:text-base text-gray-500 mt-1">Access your most important features instantly</p>
                </div>
                <div className="hidden lg:block">
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {/* Add Product Quick Action */}
                <button
                  onClick={handleAddProduct}
                  className="group relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-2 border border-gray-100 hover:border-green-200"
                >
                  {/* Background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-transparent to-green-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                    <div className="absolute top-4 right-4 w-16 h-16 bg-green-400 rounded-full blur-xl"></div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 bg-green-300 rounded-full blur-lg"></div>
                  </div>
                  
                  <div className="relative flex flex-col items-center text-center space-y-4">
                    {/* Icon container with enhanced styling */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                      <div className="relative p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-green-100 via-green-50 to-green-200 text-green-600 transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-green-200/50 border border-green-200/50">
                        <FiGrid className="w-7 h-7 lg:w-8 lg:h-8 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 text-base lg:text-lg group-hover:text-green-700 transition-colors duration-300">
                        Add Product
                      </h4>
                      <p className="text-xs lg:text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300 leading-relaxed">
                        Create new product listing with full details
                      </p>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:w-12"></div>
                  </div>
                </button>

                {/* View Orders Quick Action */}
                <button
                  onClick={() => setActiveTab('services')}
                  className="group relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-2 border border-gray-100 hover:border-purple-200"
                >
                  {/* Background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-purple-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                    <div className="absolute top-4 right-4 w-16 h-16 bg-purple-400 rounded-full blur-xl"></div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 bg-purple-300 rounded-full blur-lg"></div>
                  </div>
                  
                  <div className="relative flex flex-col items-center text-center space-y-4">
                    {/* Icon container with enhanced styling */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                      <div className="relative p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-purple-100 via-purple-50 to-purple-200 text-purple-600 transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-purple-200/50 border border-purple-200/50">
                        <FiPackage className="w-7 h-7 lg:w-8 lg:h-8 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 text-base lg:text-lg group-hover:text-purple-700 transition-colors duration-300">
                        View Orders
                      </h4>
                      <p className="text-xs lg:text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300 leading-relaxed">
                        Monitor and manage all order activities
                      </p>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:w-12"></div>
                  </div>
                </button>

                {/* Manage Categories Quick Action */}
                <button
                  onClick={() => setActiveTab('categories')}
                  className="group relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-2 border border-gray-100 hover:border-blue-200"
                >
                  {/* Background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                    <div className="absolute top-4 right-4 w-16 h-16 bg-blue-400 rounded-full blur-xl"></div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 bg-blue-300 rounded-full blur-lg"></div>
                  </div>
                  
                  <div className="relative flex flex-col items-center text-center space-y-4">
                    {/* Icon container with enhanced styling */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                      <div className="relative p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-blue-100 via-blue-50 to-blue-200 text-blue-600 transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-200/50 border border-blue-200/50">
                        <FiTag className="w-7 h-7 lg:w-8 lg:h-8 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 text-base lg:text-lg group-hover:text-blue-700 transition-colors duration-300">
                        Categories
                      </h4>
                      <p className="text-xs lg:text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300 leading-relaxed">
                        Organize products with smart categories
                      </p>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:w-12"></div>
                  </div>
                </button>

                {/* View Products Quick Action */}
                <button
                  onClick={() => setActiveTab('products')}
                  className="group relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-white p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:scale-105 hover:-translate-y-2 border border-gray-100 hover:border-orange-200"
                >
                  {/* Background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-transparent to-orange-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                    <div className="absolute top-4 right-4 w-16 h-16 bg-orange-400 rounded-full blur-xl"></div>
                    <div className="absolute bottom-4 left-4 w-12 h-12 bg-orange-300 rounded-full blur-lg"></div>
                  </div>
                  
                  <div className="relative flex flex-col items-center text-center space-y-4">
                    {/* Icon container with enhanced styling */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                      <div className="relative p-4 lg:p-5 rounded-2xl bg-gradient-to-br from-orange-100 via-orange-50 to-orange-200 text-orange-600 transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-orange-200/50 border border-orange-200/50">
                        <FiGrid className="w-7 h-7 lg:w-8 lg:h-8 transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-bold text-gray-900 text-base lg:text-lg group-hover:text-orange-700 transition-colors duration-300">
                        All Products
                      </h4>
                      <p className="text-xs lg:text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300 leading-relaxed">
                        Browse and manage your product catalog
                      </p>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:w-12"></div>
                  </div>
                </button>
              </div>
            </div>
          )}
      
          {/* Other tabs would have their respective content */}
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}