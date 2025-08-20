export interface Category {
  category_id: string;
  dealer_id: string;
  image?: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  updated_at: string;
}

export interface SubCategory {
  sub_category_id: string;
  name: string;
  slug: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  brand_name: string;
  created_at: string;
  updated_at: string;
}

export interface SubBrand {
  sub_brand_name: string;
  brand_name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  product_id: string;
  dealer_id: string;
  sub_category_id?: string;
  category_id: string;
  slug: string;
  name: string;
  description: string;
  short_description: string;
  sale_price: number;
  original_price: number;
  rating: number;
  brand_name?: string; // Made optional
  sub_brand_name?: string;
  manufacture?: string; // New manufacture field
  image_1?: string | Buffer; // BLOB field for additional image 1
  image_2?: string | Buffer; // BLOB field for additional image 2
  image_3?: string | Buffer; // BLOB field for additional image 3
  image_4?: string | Buffer; // BLOB field for additional image 4
  images?: string[]; // Array of processed images for frontend (data URLs)
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  is_hot_deal: boolean;
  created_at: string;
  updated_at: string;
  // Additional fields from JOIN queries
  dealer_name?: string;
  business_name?: string;
  dealer_phone?: string;
  category_name?: string;
  sub_category_name?: string;
}

export interface Dealer {
  dealer_id: string;
  business_name: string;
  name: string;
  email: string;
  password_hash: string;
  phone: string;
  business_address: string;
  pincode: string;
  tax_id: string;
  is_verified: boolean;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  is_active?: boolean;
  is_featured?: boolean;
  dealer_id: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
  is_featured?: boolean;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  short_description: string;
  sale_price: number;
  original_price: number;
  rating?: number;
  image?: string; // BLOB field for primary image (optional for backward compatibility)
  images?: string[]; // Array of base64 data URLs for multiple images
  category_id: string;
  sub_category_id?: string; // Optional sub-category
  brand_name?: string; // Made optional
  sub_brand_name?: string; // Optional sub-brand
  manufacture?: string; // New manufacture field
  stock_quantity: number;
  is_active?: boolean;
  is_featured?: boolean;
  is_hot_deal?: boolean;
  dealer_id: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  short_description?: string;
  sale_price?: number;
  original_price?: number;
  rating?: number;
  image?: string; // BLOB field for primary image
  images?: string[]; // Array of base64 data URLs for multiple images
  category_id?: string;
  sub_category_id?: string; // Optional sub-category
  brand_name?: string;
  sub_brand_name?: string; // Optional sub-brand
  manufacture?: string; // New manufacture field
  stock_quantity?: number;
  is_active?: boolean;
  is_featured?: boolean;
  is_hot_deal?: boolean;
  dealer_id?: string;
}

export interface Order {
  order_id: string;
  dealer_id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  shipping_pincode: string;
  order_date: string;
  order_status: string;
  total_amount: string | number;
  tax_amount: string | number;
  shipping_cost: string | number;
  discount_amount: string | number;
  payment_method: string;
  payment_status: string;
  transaction_id?: string;
  // Additional fields from JOIN queries
  dealer_name?: string;
  business_name?: string;
  dealer_phone?: string;
  dealer_address?: string;
  dealer_pincode?: string;
  product_name?: string;
  product_image?: string;
  product_description?: string;
  product_price?: string | number;
  brand_name?: string;
  sub_brand_name?: string;
}

// ServiceOrder and OrderItem interfaces removed as per user requirements
// Only using: orders, products, categories, dealers tables

export interface CreateOrderRequest {
  user_id: string;
  dealer_id: string;
  product_id: string;
  quantity: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  shipping_pincode: string;
  total_amount: number;
  tax_amount: number;
  shipping_cost: number;
  discount_amount?: number;
  payment_method: string;
  payment_status?: string;
  transaction_id?: string;
}

// CreateServiceOrderRequest and CreateOrderItemRequest interfaces removed as per user requirements
// Only using: orders, products, categories, dealers tables

export interface UpdateOrderRequest {
  order_status?: string;
  payment_status?: string;
} 