'use client';

import React from 'react';
import { FiX, FiEdit, FiTrash2, FiStar, FiPackage, FiTag, FiCalendar, FiUser } from 'react-icons/fi';
import { Product } from '@/types/database';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  getCategoryName: (categoryId: string) => string;
  getImageSrc: (imageData: any) => string;
  deletingProductId?: string | null;
}

export default function ProductDetail({ 
  product, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  getCategoryName, 
  getImageSrc,
  deletingProductId 
}: ProductDetailProps) {
  if (!isOpen || !product) return null;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStockStatusColor = (quantity: number) => {
    if (quantity > 10) return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800';
    if (quantity > 0) return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800';
    return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800';
  };

  const getStockStatusText = (quantity: number) => {
    if (quantity > 10) return 'In Stock';
    if (quantity > 0) return 'Low Stock';
    return 'Out of Stock';
  };

  return (
    <>
      {/* Side Panel */}
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 transform translate-x-0 transition-transform duration-300 ease-in-out overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 pt-[26px] pb-[26px] bg-white border-b border-gray-200 px-6 py-4 shadow-sm z-20">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
              Product Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 transition-all duration-300 hover:scale-110 hover:bg-gray-100 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Product Content */}
        <div className="p-6 space-y-6">
          {/* Product Image */}
          <div className="relative z-10">
            {product.image_1 ? (
              <img
                className="w-full h-64 rounded-xl object-cover shadow-lg transition-all duration-300 hover:scale-105"
                src={getImageSrc(product.image_1)}
                alt={safeRender(product.name)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
                          <div className={`w-full h-64 rounded-xl bg-gray-200 flex items-center justify-center shadow-lg ${product.image_1 ? 'hidden' : ''}`}>
              <div className="text-center">
                <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <span className="text-gray-500 text-sm">No Image Available</span>
              </div>
            </div>
            
            {/* Status Badges */}
            <div className="absolute top-3 left-3 flex flex-col space-y-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full shadow-lg ${
                product.is_active ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              }`}>
                {product.is_active ? 'Active' : 'Inactive'}
              </span>
              {product.is_featured && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full shadow-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  Featured
                </span>
              )}
              {product.is_hot_deal && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full shadow-lg bg-gradient-to-r from-red-500 to-pink-500 text-white">
                  Hot Deal
                </span>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-800 mb-1">{safeRender(product.name)}</h1>
                <p className="text-sm text-gray-600">{safeRender(product.brand_name || '')}</p>
              </div>
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(product.sale_price)}
                </div>
                {product.original_price > product.sale_price && (
                  <div className="text-sm text-gray-500 line-through">
                    {formatCurrency(product.original_price)}
                  </div>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating || 0) 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">({product.rating || 0}/5)</span>
            </div>
          </div>

          {/* Stock Status */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FiPackage className="w-4 h-4 text-gray-600 mr-2" />
                <span className="font-semibold text-sm text-gray-700">Stock Status</span>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(product.stock_quantity)}`}>
                {getStockStatusText(product.stock_quantity)} ({product.stock_quantity})
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center">
              <FiTag className="w-4 h-4 text-gray-600 mr-2" />
              <span className="font-semibold text-sm text-gray-700 mr-2">Category:</span>
              <span className="text-sm text-gray-600">{getCategoryName(product.category_id)}</span>
            </div>
          </div>

          {/* Brand Information */}
          {(product.brand_name || product.sub_brand_name || product.manufacture) && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              {product.brand_name && (
                <div className="flex items-center">
                  <FiTag className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="font-semibold text-sm text-gray-700 mr-2">Brand:</span>
                  <span className="text-sm text-gray-600">{safeRender(product.brand_name)}</span>
                </div>
              )}
              {product.sub_brand_name && (
                <div className="flex items-center">
                  <FiTag className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="font-semibold text-sm text-gray-700 mr-2">Sub-Brand:</span>
                  <span className="text-sm text-gray-600">{safeRender(product.sub_brand_name)}</span>
                </div>
              )}
              {product.manufacture && (
                <div className="flex items-center">
                  <FiTag className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="font-semibold text-sm text-gray-700 mr-2">Manufacturer:</span>
                  <span className="text-sm text-gray-600">{safeRender(product.manufacture)}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <div 
                className="text-sm text-gray-700 leading-relaxed max-h-32 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: safeRender(product.description) }}
              />
            </div>
          </div>

          {/* Short Description */}
          {product.short_description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Short Description</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{safeRender(product.short_description)}</p>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <FiCalendar className="w-4 h-4 text-gray-600 mr-2" />
                <div>
                  <div className="font-semibold text-sm text-gray-700">Created</div>
                  <div className="text-sm text-gray-600">{formatDate(product.created_at)}</div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <FiCalendar className="w-4 h-4 text-gray-600 mr-2" />
                <div>
                  <div className="font-semibold text-sm text-gray-700">Updated</div>
                  <div className="text-sm text-gray-600">{formatDate(product.updated_at)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dealer Info */}
          {product.dealer_name && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center">
                <FiUser className="w-4 h-4 text-gray-600 mr-2" />
                <div>
                  <div className="font-semibold text-sm text-gray-700">Dealer</div>
                  <div className="text-sm text-gray-600">{safeRender(product.dealer_name)}</div>
                  {product.business_name && (
                    <div className="text-xs text-gray-500">{safeRender(product.business_name)}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => onEdit(product)}
              className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg text-sm"
            >
              <FiEdit className="w-4 h-4 mr-2" />
              Edit Product
            </button>
            <button
              onClick={() => onDelete(product.product_id)}
              disabled={deletingProductId === product.product_id}
              className={`flex items-center justify-center px-4 py-2 font-semibold rounded-lg focus:outline-none transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg text-sm ${
                deletingProductId === product.product_id
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-2 focus:ring-red-500 text-white'
              }`}
            >
              {deletingProductId === product.product_id ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <FiTrash2 className="w-4 h-4 mr-2" />
              )}
              {deletingProductId === product.product_id ? 'Deleting...' : 'Delete Product'}
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-lg text-sm"
            >
              <FiX className="w-4 h-4 mr-2" />
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}