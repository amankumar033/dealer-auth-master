'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types/database';
import { categoryApi } from '@/lib/api';
import { FiGrid, FiUser, FiFilter, FiDownload, FiSearch } from 'react-icons/fi';
import { useToast } from '@/app/components/ui/ToastContainer';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';

interface CategoryManagerProps {
  dealerId?: string;
  onCategoryClick?: (category: CategoryWithExtras) => void;
}

type CategoryWithExtras = Category & { total_products?: number };

export default function CategoryManager({ dealerId = '1', onCategoryClick }: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { showSuccess } = useToast();

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading categories for dealerId:', dealerId, 'viewMode:', viewMode);
      let data;
      if (viewMode === 'my') {
        // Get categories where the dealer has created products
        const response = await fetch(`/api/categories?dealer_id=${dealerId}&dealer_products=true`);
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error('Failed to fetch dealer product categories');
        }
      } else {
        // For 'all' view, show all categories from all dealers
        data = await categoryApi.getAllCategories();
      }
      console.log('Loaded categories:', data);
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode, dealerId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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

  // Export functionality
  const exportToCSV = () => {
    const headers = viewMode === 'my' 
      ? ['ID', 'Name', 'Description', 'Total Products', 'Status']
      : ['ID', 'Name', 'Description', 'Status'];
    
    const csvData = filteredCategories.map(category => {
      const baseData = [
        category.category_id,
        safeRender(category.name),
        safeRender(category.description),
        category.is_active ? 'Active' : 'Inactive'
      ];
      
      if (viewMode === 'my') {
        // Insert total_products after description
        baseData.splice(3, 0, String(category.total_products || 0));
      }
      
      return baseData;
    });
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories_${viewMode === 'my' ? 'my_' : 'all_'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSuccess('Export Successful', 'Categories exported to CSV file successfully!');
  };

  // Filter and sort categories
  const filteredCategories = (categories || []).filter(category => {
    const matchesSearch = safeRender(category.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         safeRender(category.description).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'date':
        aValue = new Date(a.updated_at);
        bValue = new Date(b.updated_at);
        break;
      case 'status':
        aValue = a.is_active ? 1 : 0;
        bValue = b.is_active ? 1 : 0;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text="Loading categories..." />
      </div>
    );
  }

  return (
            <div className="w-full bg-white lg:rounded-xl shadow-lg p-4 lg:p-6 transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 lg:mb-6 space-y-4 lg:space-y-0">
        <h2 className="text-xl lg:text-2xl font-bold text-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Category Management</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner">
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ease-out transform hover:scale-105 flex-1 ${
                viewMode === 'all' 
                  ? 'bg-white text-blue-600 shadow-lg scale-105' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FiGrid className="mr-2 transition-transform duration-300" />
              <span className="">All Categories</span>
            </button>
            <button
              onClick={() => setViewMode('my')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ease-out transform hover:scale-105 flex-1 whitespace-nowrap ${
                viewMode === 'my' 
                  ? 'bg-white text-blue-600 shadow-lg scale-105' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FiUser className="mr-1 transition-transform duration-300" />
              <span className="hidden sm:inline">My Product Categories</span>
              <span className="sm:hidden">My Product</span>
            </button>
          </div>
          
          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg"
          >
            <FiDownload className="mr-2 transition-transform duration-300" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition-all duration-300 ${
              showFilters 
                ? 'bg-blue-50 text-blue-700 border-blue-300' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiFilter className="mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'status')}
                className="block text-gray-600 w-full px-2 lg:px-3 py-1.5 lg:py-2 border border-gray-300 rounded-lg text-xs lg:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Name</option>
                <option value="date">Date</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div>
              <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Sort Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="block w-full text-gray-600 px-2 lg:px-3 py-1.5 lg:py-2 border border-gray-300 rounded-lg text-xs lg:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="w-full overflow-x-auto rounded-xl shadow-lg">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
            <tr>
              <th className="w-1/4 px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">
                Category Name
              </th>
              <th className="w-1/2 px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">
                Description
              </th>
              {viewMode === 'my' && (
                <th className="w-1/6 px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">
                  Total Products
                </th>
              )}
              <th className="w-1/6 px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider whitespace-nowrap">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCategories.map((category) => (
              <tr 
                key={category.category_id} 
                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-gray-50 transition-all duration-500 ease-out transform hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100 border border-transparent hover:border-blue-200 rounded-lg cursor-pointer"
                onClick={() => onCategoryClick?.(category)}
              >
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-black transition-colors duration-300">{safeRender(category.name)}</div>
                </td>
                <td className="px-3 lg:px-6 py-4">
                  <div className="text-sm text-gray-700 max-w-xs truncate transition-colors duration-300">
                    {safeRender(category.description)}
                  </div>
                </td>
                {viewMode === 'my' && (
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 transition-all duration-300 hover:scale-110">
                        {category.total_products || 0}
                      </span>
                    </div>
                  </td>
                )}
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                  <div className="flex justify-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-110 ${
                      category.is_active ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                    }`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-lg font-bold text-black mb-2">No categories found</div>
            <div className="text-gray-500 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'No categories available'}
            </div>
          </div>
        )}
      </div>
      
      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{sortedCategories.length}</span> of <span className="font-semibold">{categories.length}</span> categories
          </div>
          <div className="text-sm text-gray-600">
            {viewMode === 'all' ? 'All Categories' : 'Categories with My Products'}
          </div>
        </div>
      </div>
    </div>
  );
} 