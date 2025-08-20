// Comprehensive validation and error handling utilities

// Type definitions for validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export interface DatabaseValidationConfig {
  maxStringLength: number;
  maxTextLength: number;
  maxDecimalPrecision: number;
  maxDecimalScale: number;
  allowedStatuses: string[];
  allowedPaymentMethods: string[];
  allowedPaymentStatuses: string[];
  allowedOrderStatuses: string[];
}

// Default validation configuration
export const defaultValidationConfig: DatabaseValidationConfig = {
  maxStringLength: 255,
  maxTextLength: 65535,
  maxDecimalPrecision: 10,
  maxDecimalScale: 2,
  allowedStatuses: ['active', 'inactive'],
  allowedPaymentMethods: ['credit_card', 'debit_card', 'cash', 'bank_transfer', 'upi', 'paypal'],
  allowedPaymentStatuses: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
  allowedOrderStatuses: ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned_refunded', 'failed_delivery']
};

// Utility functions
export function sanitizeString(value: any, maxLength: number = 255): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return String(value).substring(0, maxLength);
  return value.trim().substring(0, maxLength);
}

export function sanitizeNumber(value: any, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  return Math.max(min, Math.min(max, num));
}

export function sanitizeDecimal(value: any, precision: number = 10, scale: number = 2): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  return Number(num.toFixed(scale));
}

export function sanitizeBoolean(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

export function sanitizeVarcharId(value: any): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  const str = String(value).trim();
  
  if (str.length === 0) {
    return null;
  }
  
  // More lenient validation - allow letters, numbers, and common separators
  // This allows IDs like "PRO15", "DLR7", "CAT-001", etc.
  const sanitized = str.replace(/[^a-zA-Z0-9_\-]/g, '').substring(0, 50);
  
  return sanitized.length > 0 ? sanitized : null;
}

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

export function validatePincode(pincode: string): boolean {
  if (!pincode || typeof pincode !== 'string') return false;
  const pincodeRegex = /^[0-9]{6}$/;
  return pincodeRegex.test(pincode.trim());
}

// Product validation
export function validateProductData(data: any, config: DatabaseValidationConfig = defaultValidationConfig): ValidationResult {
  const errors: string[] = [];
  const sanitized: any = {};

  // Required fields validation
  const requiredFields = ['name', 'description', 'sale_price', 'original_price', 'category_id', 'brand_name', 'dealer_id'];
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // NO SANITIZATION - preserve original values as requested
  sanitized.name = data.name;
  if (!sanitized.name) errors.push('Product name is required');

  sanitized.description = data.description;
  if (!sanitized.description) errors.push('Product description is required');

  sanitized.sale_price = data.sale_price;
  if (!sanitized.sale_price || Number(sanitized.sale_price) <= 0) {
    errors.push('Invalid sale price');
  }

  sanitized.original_price = data.original_price;
  if (!sanitized.original_price || Number(sanitized.original_price) <= 0) {
    errors.push('Invalid original price');
  }

  if (sanitized.sale_price && sanitized.original_price && Number(sanitized.sale_price) >= Number(sanitized.original_price)) {
    errors.push('Sale price must be less than original price');
  }

  sanitized.rating = data.rating ?? 0;
  if (sanitized.rating && (Number(sanitized.rating) < 0 || Number(sanitized.rating) > 5)) {
    errors.push('Rating must be between 0 and 5');
  }

  // Handle both single image and multiple images
  sanitized.image = data.image;
  sanitized.images = data.images;
  
  // Check if we have either a single image or multiple images
  const hasSingleImage = sanitized.image && (typeof sanitized.image === 'string' || sanitized.image instanceof Buffer);
  const hasMultipleImages = sanitized.images && Array.isArray(sanitized.images) && sanitized.images.length > 0;
  
  if (!hasSingleImage && !hasMultipleImages) {
    errors.push('Product image is required');
  }

  sanitized.category_id = data.category_id;
  if (!sanitized.category_id) errors.push('Category ID is required');

  sanitized.brand_name = data.brand_name;
  if (!sanitized.brand_name) errors.push('Brand name is required');

  sanitized.dealer_id = data.dealer_id;
  if (!sanitized.dealer_id) errors.push('Dealer ID is required');

  sanitized.short_description = data.short_description;
  sanitized.brand_name = data.brand_name ?? 'Unknown';
  sanitized.sub_brand_name = data.sub_brand_name;
  sanitized.sub_category_id = data.sub_category_id;
  sanitized.stock_quantity = data.stock_quantity ?? 0;
  sanitized.is_active = data.is_active ?? true;
  sanitized.is_featured = data.is_featured ?? false;
  sanitized.is_hot_deal = data.is_hot_deal ?? false;

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitized : undefined
  };
}

// Order validation
export function validateOrderData(data: any, config: DatabaseValidationConfig = defaultValidationConfig): ValidationResult {
  const errors: string[] = [];
  const sanitized: any = {};

  // Required fields validation
  const requiredFields = ['user_id', 'dealer_id', 'product_id', 'customer_name', 'customer_email', 
                         'shipping_address', 'shipping_pincode', 'total_amount', 'tax_amount', 
                         'shipping_cost', 'payment_method'];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // NO SANITIZATION - preserve original values as requested
  sanitized.user_id = data.user_id;
  if (!sanitized.user_id) errors.push('User ID is required');

  sanitized.dealer_id = data.dealer_id;
  if (!sanitized.dealer_id) errors.push('Dealer ID is required');

  sanitized.product_id = data.product_id;
  if (!sanitized.product_id) errors.push('Product ID is required');

  sanitized.quantity = data.quantity;
  if (!sanitized.quantity || Number(sanitized.quantity) <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  sanitized.customer_name = data.customer_name;
  if (!sanitized.customer_name) errors.push('Customer name is required');

  sanitized.customer_email = data.customer_email;
  if (!sanitized.customer_email || !validateEmail(sanitized.customer_email)) {
    errors.push('Invalid customer email');
  }

  sanitized.customer_phone = data.customer_phone;
  if (sanitized.customer_phone && !validatePhone(sanitized.customer_phone)) {
    errors.push('Invalid customer phone');
  }

  sanitized.shipping_address = data.shipping_address;
  if (!sanitized.shipping_address) errors.push('Shipping address is required');

  sanitized.shipping_pincode = data.shipping_pincode;
  if (!sanitized.shipping_pincode || !validatePincode(sanitized.shipping_pincode)) {
    errors.push('Invalid shipping pincode');
  }

  sanitized.total_amount = data.total_amount;
  if (!sanitized.total_amount || Number(sanitized.total_amount) <= 0) {
    errors.push('Invalid total amount');
  }

  sanitized.tax_amount = data.tax_amount;
  if (!sanitized.tax_amount || Number(sanitized.tax_amount) < 0) {
    errors.push('Invalid tax amount');
  }

  sanitized.shipping_cost = data.shipping_cost;
  if (!sanitized.shipping_cost || Number(sanitized.shipping_cost) < 0) {
    errors.push('Invalid shipping cost');
  }

  sanitized.discount_amount = data.discount_amount ?? 0;
  if (sanitized.discount_amount && Number(sanitized.discount_amount) < 0) {
    errors.push('Invalid discount amount');
  }

  sanitized.payment_method = data.payment_method;
  if (!sanitized.payment_method || !config.allowedPaymentMethods.includes(sanitized.payment_method)) {
    errors.push('Invalid payment method');
  }

  sanitized.transaction_id = data.transaction_id;

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitized : undefined
  };
}

// Category validation
export function validateCategoryData(data: any, config: DatabaseValidationConfig = defaultValidationConfig): ValidationResult {
  const errors: string[] = [];
  const sanitized: any = {};

  // Required fields validation
  if (!data.name) errors.push('Name is required');
  if (!data.dealer_id) errors.push('Dealer ID is required');

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // NO SANITIZATION - preserve original values as requested
  sanitized.name = data.name;
  if (!sanitized.name) errors.push('Category name is required');

  sanitized.description = data.description;
  sanitized.dealer_id = data.dealer_id;
  if (!sanitized.dealer_id) errors.push('Dealer ID is required');

  sanitized.is_active = data.is_active ?? true;
  sanitized.is_featured = data.is_featured ?? false;

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitized : undefined
  };
}

// Update validation (for PUT requests)
export function validateUpdateData(data: any, allowedFields: string[]): ValidationResult {
  const errors: string[] = [];
  const sanitized: any = {};

  // Check if at least one field is provided
  const providedFields = Object.keys(data).filter(key => data[key] !== undefined);
  
  if (providedFields.length === 0) {
    errors.push('At least one field must be provided for update');
    return { isValid: false, errors };
  }

  // Validate that all provided fields are allowed (allow dealer_id to pass through)
  for (const field of providedFields) {
    if (!allowedFields.includes(field) && field !== 'dealer_id') {
      errors.push(`Field '${field}' is not allowed for update`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // NO SANITIZATION - preserve original values as requested
  for (const field of providedFields) {
    sanitized[field] = data[field]; // Keep original value without any sanitization
  }

  // Additional validation for specific fields (handle non-sanitized values)
  if (sanitized.sale_price !== undefined && sanitized.original_price !== undefined) {
    const salePrice = Number(sanitized.sale_price);
    const originalPrice = Number(sanitized.original_price);
    if (salePrice >= originalPrice) {
      errors.push('Sale price must be less than original price');
    }
  }

  if (sanitized.rating !== undefined) {
    const rating = Number(sanitized.rating);
    if (rating < 0 || rating > 5) {
      errors.push('Rating must be between 0 and 5');
    }
  }

  if (sanitized.stock_quantity !== undefined) {
    const stock = Number(sanitized.stock_quantity);
    if (stock < 0) {
      errors.push('Stock quantity cannot be negative');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitized : undefined
  };
}

// Performance optimization utilities
export function createQueryCache() {
  const cache = new Map();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  return {
    get: (key: string) => {
      const item = cache.get(key);
      if (!item) return null;
      if (Date.now() - item.timestamp > maxAge) {
        cache.delete(key);
        return null;
      }
      return item.data;
    },
    set: (key: string, data: any) => {
      cache.set(key, { data, timestamp: Date.now() });
    },
    clear: () => cache.clear(),
    size: () => cache.size
  };
}

// Error response formatter
export function formatErrorResponse(error: any, context: string = 'API'): any {
  const errorResponse: any = {
    error: 'An error occurred',
    context,
    timestamp: new Date().toISOString()
  };

  if (error instanceof Error) {
    errorResponse.message = error.message;
    errorResponse.type = error.constructor.name;
  } else if (typeof error === 'string') {
    errorResponse.message = error;
  } else if (error && typeof error === 'object') {
    errorResponse.message = error.message || 'Unknown error';
    errorResponse.code = error.code;
    errorResponse.errno = error.errno;
  }

  // Don't expose sensitive information in production
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error instanceof Error ? error.stack : undefined;
    errorResponse.details = error;
  }

  return errorResponse;
}

// Request parameter validation
export function validateRequestParams(params: any, requiredParams: string[]): ValidationResult {
  const errors: string[] = [];
  const sanitized: any = {};

  // Check for required parameters
  for (const paramName of requiredParams) {
    const value = params[paramName];
    
    if (value === null || value === undefined || value === '') {
      errors.push(`Parameter '${paramName}' is required`);
      continue;
    }

    // NO SANITIZATION - preserve original values as requested
    sanitized[paramName] = value;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitized : undefined
  };
} 