'use client';

import React, { useState, useEffect } from 'react';
import { FiX, FiTrash2, FiPackage, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { Category, Product } from '@/types/database';
import { productApi, categoryApi } from '@/lib/api';
import { useToast } from './ToastContainer';
import LoadingSpinner from './LoadingSpinner';

interface RightSidebarConfirmationProps {
  category: Category | null;
  dealerId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  getImageSrc: (imageData: any) => string;
}

export default function RightSidebarConfirmation({
  category,
  dealerId,
  isOpen,
  onClose,
  onConfirm,
  getImageSrc
}: RightSidebarConfirmationProps) {
  const [dealerProducts, setDealerProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen && category) {
      loadProducts();
    }
  }, [isOpen, category]);

  const loadProducts = async () => {
    if (!category) return;
    
    setLoading(true);
    try {
      // Get products for this dealer in this category
      const dealerProds = await productApi.getByCategoryForDealer(category.category_id, dealerId);
      setDealerProducts(dealerProds);

      // Get all products in this category (to check if other dealers have products)
      const allProds = await productApi.getByCategory(category.category_id);
      setAllProducts(allProds);
    } catch (error) {
      console.error('Error loading products:', error);
      showError('Error', 'Failed to load products for this category');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!category) return;
    
    setDeleting(true);
    try {
      // Determine deletion strategy
      const otherDealersHaveProducts = allProducts.some(product => 
        product.dealer_id !== dealerId
      );

      console.log('🔍 Debug: Deletion strategy analysis:');
      console.log('  - dealerId:', dealerId);
      console.log('  - allProducts:', allProducts.map(p => ({ id: p.product_id, dealer_id: p.dealer_id })));
      console.log('  - otherDealersHaveProducts:', otherDealersHaveProducts);

      if (otherDealersHaveProducts) {
        console.log('✅ Debug: Using Case 2 - Disassociate category');
        // Case 2: Other dealers have products in this category
        // Delete only this dealer's products and set dealer_id to null for the category
        await deleteDealerProductsAndUpdateCategory();
      } else {
        console.log('✅ Debug: Using Case 1 - Delete category completely');
        // Case 1: Only this dealer has products in this category
        // Delete all products and the category
        await deleteAllProductsAndCategory();
      }

      onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting category:', error);
      showError('Error', 'Failed to delete category. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const deleteDealerProductsAndUpdateCategory = async () => {
    if (!category) return;
    
    try {
      console.log('🔍 Debug: Starting deleteDealerProductsAndUpdateCategory');
      console.log('  - category.category_id:', category.category_id);
      console.log('  - dealerId:', dealerId);
      console.log('  - dealerProducts count:', dealerProducts.length);
      
      // Delete all products of this dealer in this category (this will cascade delete orders)
      for (const product of dealerProducts) {
        console.log('  - Deleting product:', product.product_id);
        await productApi.delete(product.product_id, dealerId);
      }

      console.log('  - All products and related orders deleted, now disassociating category...');
      
      // Direct API call to disassociate category
      const response = await fetch(`/api/categories/${category.category_id}?dealer_id=${dealerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealer_id: null,
          id: 1
        })
      });

      console.log('  - Disassociation response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('  - Disassociation failed:', errorText);
        throw new Error(`Failed to disassociate category: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('  - Disassociation result:', result);
      console.log('  - Category disassociation completed');
    } catch (error) {
      console.error('Error in deleteDealerProductsAndUpdateCategory:', error);
      throw new Error(`Failed to disassociate category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteAllProductsAndCategory = async () => {
    if (!category) return;
    
    try {
      // Delete all products in this category (this will cascade delete orders)
      for (const product of allProducts) {
        await productApi.delete(product.product_id, product.dealer_id);
      }

      // Delete the category
      const response = await fetch(`/api/categories/${category.category_id}?dealer_id=${dealerId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      console.error('Error in deleteAllProductsAndCategory:', error);
      throw new Error(`Failed to delete category and products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (Buffer.isBuffer(value)) return value.toString('utf8');
    return String(value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!isOpen || !category) return null;

  const otherDealersHaveProducts = allProducts.some(product => 
    product.dealer_id !== dealerId
  );

  return (
    <>
      {/* Right Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Loading Overlay */}
        {deleting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-lg font-medium text-gray-700">Deleting category...</p>
              <p className="text-sm text-gray-500">Please wait while we process your request</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <FiAlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Delete Category
                </h1>
                <p className="text-sm text-gray-600">
                  {category?.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner size="lg" text="Loading products..." />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Warning Message */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FiAlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-2">
                      {otherDealersHaveProducts 
                        ? 'Other dealers also have products in this category' 
                        : 'This will permanently delete the category and all its products'
                      }
                    </h3>
                    <p className="text-sm text-yellow-700">
                      {otherDealersHaveProducts 
                        ? 'Only your products will be deleted. The category will remain but will no longer be associated with you.'
                        : 'This action cannot be undone. All products in this category will be permanently deleted.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Products List */}
              {dealerProducts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Your Products ({dealerProducts.length})
                  </h3>
                  <div className="space-y-3">
                    {dealerProducts.map((product) => (
                      <div key={product.product_id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {product.image_1 && getImageSrc(product.image_1) ? (
                              <img
                                src={getImageSrc(product.image_1) || ''}
                                alt={safeRender(product.name)}
                                className="w-10 h-10 rounded-lg object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center ${product.image_1 && getImageSrc(product.image_1) ? 'hidden' : ''}`}>
                              <FiPackage className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate text-sm">
                              {safeRender(product.name)}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                              {safeRender(product.brand_name)}
                            </p>
                            <p className="text-xs font-medium text-green-600">
                              {formatCurrency(product.sale_price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Dealers Info */}
              {otherDealersHaveProducts && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <FiCheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-800 mb-1 text-sm">
                        Category will be preserved
                      </h3>
                      <p className="text-xs text-blue-700">
                        Other dealers have {allProducts.filter(p => p.dealer_id !== dealerId).length} products in this category. 
                        The category will remain but will no longer be associated with your account.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {dealerProducts.length === 0 && (
                <div className="text-center py-8">
                  <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
                  <p className="text-gray-500 text-sm">
                    You don't have any products in this category.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting || loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {deleting ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <FiTrash2 className="w-4 h-4" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 