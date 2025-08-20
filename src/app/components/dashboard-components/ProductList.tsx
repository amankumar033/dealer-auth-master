'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product, Category } from '@/types/database';
import { productApi, categoryApi } from '@/lib/api';
import { FiEdit, FiTrash2, FiPlus, FiEye, FiFilter, FiDownload, FiSearch } from 'react-icons/fi';
import { formatCurrency, safeNumber } from '@/lib/utils';
import { useToast } from '@/app/components/ui/ToastContainer';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import ProductDetail from './ProductDetail';
import CustomDropdown from '@/app/components/ui/CustomDropdown';

interface ProductListProps {
  dealerId: string;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onAdd: () => void;
  categoryProducts?: Product[];
  categoryProductsLoading?: boolean;
  selectedCategory?: Category | null;
  onBackToCategories?: () => void;
}

export default function ProductList({ 
  dealerId, 
  onEdit, 
  onDelete, 
  onAdd, 
  categoryProducts, 
  categoryProductsLoading, 
  selectedCategory,
  onBackToCategories
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const { showSuccess, showError } = useToast();

  const loadData = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      console.log('ProductList: Loading data for dealerId:', dealerId, 'page:', page);
      
      let data;
      if (categoryProducts && categoryProducts.length > 0) {
        console.log('ProductList: Using category products:', categoryProducts.length);
        data = { products: categoryProducts, pagination: {} };
      } else {
        console.log('ProductList: Fetching all products');
        data = await productApi.getAll(dealerId, undefined, page, 20, true);
      }
      
      console.log('ProductList: Received data:', data);
      
      if (append) {
        setProducts(prev => [...prev, ...data.products]);
      } else {
        setProducts(data.products);
      }
      
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('ProductList: Error loading data:', error);
      if (!append) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [dealerId, categoryProducts]);

  useEffect(() => {
    loadData(1, false);
  }, [loadData]);

  // Load categories for category name display
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('ProductList: Loading categories for category names');
        const categoriesData = await categoryApi.getAllCategories();
        console.log('ProductList: Loaded categories:', categoriesData);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } catch (error) {
        console.error('ProductList: Error loading categories:', error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  const loadMore = () => {
    if (pagination.hasNext && !loadingMore) {
      loadData(currentPage + 1, true);
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

  const handleDelete = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setDeletingProductId(productId);
        await onDelete(productId);
        
        // Update local state to remove the deleted product
        setProducts((products || []).filter(p => p.product_id !== productId));
        
        // Show success message
        showSuccess('Product deleted successfully!');
      } catch (error) {
        console.error('Failed to delete product:', error);
        showError('Failed to delete product', 'Please try again later.');
      } finally {
        setDeletingProductId(null);
      }
    }
  };

  // Use category products if available and not empty, otherwise use all products
  const productsToShow = (categoryProducts && categoryProducts.length > 0) ? categoryProducts : products;
  
  console.log('🔍 ProductList: Data summary - productsToShow:', productsToShow?.length || 0, 'categoryProducts:', categoryProducts?.length || 0, 'products:', products?.length || 0);
  
  const filteredProducts = (productsToShow || []).filter(product => {
    // Simplified filtering for debugging
    const matchesCategory = !selectedCategoryFilter || product.category_id === selectedCategoryFilter;
    const productName = String(product.name || '').toLowerCase();
    const brandName = String(product.brand_name || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = productName.includes(searchLower) || brandName.includes(searchLower);
    
    return matchesCategory && matchesSearch;
  });
  
  console.log('🔍 ProductList: filteredProducts length:', filteredProducts.length);
  console.log('🔍 ProductList: First few filtered products:', filteredProducts.slice(0, 3));

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.category_id === categoryId)?.name || 'Unknown';
  };

  // Function to get proper image source for different formats
  const getImageSrc = (imageData: any) => {
    console.log('getImageSrc called with:', imageData);
    console.log('Type of imageData:', typeof imageData);
    
    // Handle null, undefined, or empty values
    if (!imageData) {
      console.log('No image data provided');
      return '';
    }
    
    // Handle string data (most common case after API processing)
    if (typeof imageData === 'string') {
      console.log('Image data is string, length:', imageData.length);
      
      // If it's already a data URL (base64), return as is
      if (imageData.startsWith('data:image/')) {
        console.log('Image is base64 data URL');
        return imageData;
      }
      
      // If it's a blob URL, return as is
      if (imageData.startsWith('blob:')) {
        console.log('Image is blob URL');
        return imageData;
      }
      
      // If it's a regular URL, return as is
      if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
        console.log('Image is HTTP URL:', imageData);
        return imageData;
      }
      
      // If it's a relative URL, make it absolute
      if (imageData.startsWith('/')) {
        console.log('Image is relative URL');
        return imageData;
      }
      
      // If it's just a filename or path, try to construct a URL
      // This assumes images are stored in a public folder
      console.log('Image is filename/path, constructing URL');
      return `/uploads/${imageData}`;
    }
    
    // Handle Buffer objects (BLOB data) - fallback for unprocessed data
    if (imageData && typeof imageData === 'object' && imageData.type === 'Buffer') {
      console.log('Image data is Buffer object, converting to base64');
      try {
        // Only use Buffer if it's available in browser
        if (typeof Buffer !== 'undefined') {
          const buffer = Buffer.from(imageData.data);
          const base64 = buffer.toString('base64');
          const mimeType = 'image/jpeg'; // Default to JPEG
          return `data:${mimeType};base64,${base64}`;
        } else {
          // Fallback for browser environment
          console.log('Buffer not available in browser, returning empty string');
          return '';
        }
      } catch (error) {
        console.error('Error converting Buffer to base64:', error);
        return '';
      }
    }
    
    // If it's any other type, return empty string
    console.log('Unknown image data type:', typeof imageData);
    return '';
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetail(true);
  };

  const handleCloseProductDetail = () => {
    setShowProductDetail(false);
    setSelectedProduct(null);
  };

  // Export functionality
  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Brand', 'Category', 'Sale Price', 'Stock', 'Status'];
    const csvData = filteredProducts.map(product => [
      product.product_id,
      safeRender(product.name),
      safeRender(product.brand_name || ''),
      getCategoryName(product.category_id),
      product.sale_price,
      safeRender(product.stock_quantity),
      product.is_active ? 'Active' : 'Inactive'
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'price':
        aValue = parseFloat(a.sale_price.toString());
        bValue = parseFloat(b.sale_price.toString());
        break;
      case 'stock':
        aValue = a.stock_quantity;
        bValue = b.stock_quantity;
        break;
      case 'date':
        aValue = new Date(a.updated_at || '');
        bValue = new Date(b.updated_at || '');
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

  console.log('🔍 ProductList: Loading states - loading:', loading, 'categoryProductsLoading:', categoryProductsLoading);
  
  if (loading || categoryProductsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" text={categoryProductsLoading ? "Loading category products..." : "Loading products..."} />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6 transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 lg:mb-6 space-y-4 lg:space-y-0">
        <div className="flex flex-col space-y-2">
          <h2 className="text-xl lg:text-2xl font-bold text-black bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
            {selectedCategory ? `Products in ${selectedCategory.name}` : 'My Products'}
          </h2>
          {selectedCategory && (
            <button
              onClick={onBackToCategories}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300"
            >
              ← Back to Categories
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-md"
          >
            <FiDownload className="mr-2 transition-transform duration-300" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={onAdd}
            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg"
          >
            <FiPlus className="mr-2 transition-transform duration-300" />
            Add Product
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-4 lg:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black transition-all duration-300 hover:shadow-md focus:shadow-lg"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-gray-500 justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              <FiFilter className="mr-2 text-gray-500 transition-transform duration-300" />
              Filters
            </button>
          </div>
          <div className="text-sm text-black font-semibold">
            {filteredProducts.length} of {(productsToShow || []).length} products
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl shadow-lg transition-all duration-500 ease-out transform hover:scale-[1.01]">
            <div>
              <label className="block text-sm text-gray-700 mb-2 font-semibold">Search</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black transition-all duration-300 hover:shadow-md focus:shadow-lg"
                />
              </div>
            </div>
            
            <CustomDropdown
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map(category => ({
                  value: category.category_id,
                  label: category.name
                }))
              ]}
              value={selectedCategoryFilter}
              onChange={setSelectedCategoryFilter}
              placeholder="Select category"
              label="Category"
              searchable
              maxHeight="max-h-48"
            />
            
            <CustomDropdown
              options={[
                { value: 'name', label: 'Name' },
                { value: 'price', label: 'Price' },
                { value: 'stock', label: 'Stock' },
                { value: 'date', label: 'Date' }
              ]}
              value={sortBy}
              onChange={(value) => setSortBy(value as 'name' | 'price' | 'stock' | 'date')}
              placeholder="Select sort field"
              label="Sort By"
              maxHeight="max-h-48"
            />
            
            <CustomDropdown
              options={[
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' }
              ]}
              value={sortOrder}
              onChange={(value) => setSortOrder(value as 'asc' | 'desc')}
              placeholder="Select sort order"
              label="Order"
              maxHeight="max-h-48"
            />
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto rounded-xl shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
            <tr>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Product
              </th>
              <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Category
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Price
              </th>
              <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Stock
              </th>
              <th className="hidden lg:table-cell px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProducts.map((product) => (
              <tr 
                key={product.product_id} 
                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-gray-50 transition-all duration-500 ease-out transform hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100 border border-transparent hover:border-blue-200 rounded-lg cursor-pointer group"
                onClick={() => handleProductClick(product)}
                title="Click to view product details"
              >
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 lg:h-12 lg:w-12 flex-shrink-0 transition-all duration-300 hover:scale-110">
                      {product.image_1 ? (
                        <img
                          className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg object-cover transition-all duration-300 hover:scale-110"
                          src={getImageSrc(product.image_1)}
                          alt={safeRender(product.name)}
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-10 w-10 lg:h-12 lg:w-12 rounded-lg bg-gray-200 flex items-center justify-center transition-all duration-300 hover:scale-110 ${product.image_1 ? 'hidden' : ''}`}>
                        <span className="text-gray-500 text-xs">No Image</span>
                      </div>
                    </div>
                    <div className="ml-3 lg:ml-4">
                      <div className="text-sm font-bold text-black transition-colors duration-300">{safeRender(product.name)}</div>
                      <div className="text-xs lg:text-sm text-gray-700 transition-colors duration-300">{safeRender(product.brand_name || '')}</div>
                      <div className="md:hidden text-xs text-gray-500 transition-colors duration-300">{getCategoryName(product.category_id)}</div>
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 transition-colors duration-300">
                  {getCategoryName(product.category_id)}
                </td>
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-black transition-colors duration-300">{formatCurrency(product.sale_price)}</div>
                  {safeNumber(product.original_price) > safeNumber(product.sale_price) && (
                    <div className="text-xs lg:text-sm text-black line-through transition-colors duration-300">{formatCurrency(product.original_price)}</div>
                  )}
                </td>
                <td className="hidden sm:table-cell px-3 lg:px-6 py-4 whitespace-nowrap">
                  <div className="flex justify-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-110 ${
                      product.stock_quantity > 10 ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                      product.stock_quantity > 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800' :
                      'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                    }`}>
                      {safeRender(product.stock_quantity)} in stock
                    </span>
                  </div>
                </td>
                <td className="hidden lg:table-cell px-3 lg:px-6 py-4 whitespace-nowrap">
                  <div className="flex justify-center">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full transition-all duration-300 hover:scale-110 ${
                      product.is_active ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' : 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                    }`}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleProductClick(product)}
                      className="text-green-600 hover:text-green-900 p-2 transition-all duration-300 hover:scale-125 hover:bg-green-100 rounded-lg hover:shadow-md"
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(product)}
                      className="text-blue-600 hover:text-blue-900 p-2 transition-all duration-300 hover:scale-125 hover:bg-blue-100 rounded-lg hover:shadow-md"
                      title="Edit"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.product_id)}
                      disabled={deletingProductId === product.product_id}
                      className={`p-2 transition-all duration-300 hover:scale-125 rounded-lg hover:shadow-md ${
                        deletingProductId === product.product_id
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-600 hover:text-red-900 hover:bg-red-100'
                      }`}
                      title="Delete"
                    >
                      {deletingProductId === product.product_id ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FiTrash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-lg font-bold text-black mb-2">No products found</div>
            <div className="text-gray-700">Try adjusting your search or filters</div>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {pagination.hasNext && !categoryProducts && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loadingMore ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading...
              </div>
            ) : (
              `Load More (${pagination.total - products.length} remaining)`
            )}
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetail
        product={selectedProduct}
        isOpen={showProductDetail}
        onClose={handleCloseProductDetail}
        onEdit={onEdit}
        onDelete={handleDelete}
        getCategoryName={getCategoryName}
        getImageSrc={getImageSrc}
        deletingProductId={deletingProductId}
      />
    </>
  );
} 