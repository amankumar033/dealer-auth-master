# New Database Structure Update

## Overview

This document outlines the comprehensive updates made to the dealer authentication system to support the new database structure with brands, sub-brands, and updated product fields.

## Database Structure Changes

### New Tables Added

#### 1. `brands` Table
```sql
CREATE TABLE brands (
  brand_name VARCHAR(255) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. `sub_brands` Table
```sql
CREATE TABLE sub_brands (
  sub_brand_name VARCHAR(255) PRIMARY KEY,
  brand_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_name) REFERENCES brands(brand_name)
);
```

### Updated Tables

#### 1. `categories` Table
```sql
ALTER TABLE categories ADD COLUMN image VARCHAR(255);
ALTER TABLE categories ADD COLUMN id INT;
ALTER TABLE categories ADD COLUMN slug VARCHAR(255);
```

#### 2. `sub_categories` Table
```sql
ALTER TABLE sub_categories ADD COLUMN category_id VARCHAR(255);
-- Remove the junction table category_sub_categories as sub_categories now has direct category_id
```

#### 3. `products` Table
```sql
-- Remove old fields
ALTER TABLE products DROP COLUMN brand;

-- Add new fields
ALTER TABLE products ADD COLUMN sub_category_id VARCHAR(255);
ALTER TABLE products ADD COLUMN brand_name VARCHAR(255);
ALTER TABLE products ADD COLUMN sub_brand_name VARCHAR(255);

-- Update field order to match new structure
-- product_id, dealer_id, sub_category_id, category_id, slug, name, description, 
-- short_description, sale_price, original_price, rating, brand_name, sub_brand_name,
-- image_1, image_2, image_3, image_4, stock_quantity, is_active, is_featured, 
-- is_hot_deal, created_at, updated_at
```

## API Changes

### New API Endpoints

#### 1. Brands API (`/api/brands`)
- **GET**: Retrieve all brands
- **POST**: Create a new brand

#### 2. Sub-Brands API (`/api/sub-brands`)
- **GET**: Retrieve sub-brands (optionally filtered by brand_name)
- **POST**: Create a new sub-brand

### Updated API Endpoints

#### 1. Products API (`/api/products`)
- Updated to handle new field names: `brand_name`, `sub_brand_name`, `sub_category_id`
- Enhanced slug generation with improved duplicate handling
- Updated validation for new required fields

#### 2. Sub-Categories API (`/api/sub-categories`)
- Updated to work with direct `category_id` relationship
- Removed dependency on junction table

## Frontend Changes

### ProductForm Component Updates

#### 1. New State Management
```typescript
const [brands, setBrands] = useState<Brand[]>([]);
const [subBrands, setSubBrands] = useState<SubBrand[]>([]);
const [showBrandDropdown, setShowBrandDropdown] = useState(false);
const [showSubBrandDropdown, setShowSubBrandDropdown] = useState(false);
const [isCreatingBrand, setIsCreatingBrand] = useState(false);
const [isCreatingSubBrand, setIsCreatingSubBrand] = useState(false);
```

#### 2. Updated Form Data Structure
```typescript
const [formData, setFormData] = useState({
  name: product?.name || '',
  description: product?.description || '',
  short_description: product?.short_description || '',
  sale_price: product?.sale_price || 0,
  original_price: product?.original_price || 0,
  rating: product?.rating || 0,
  category_id: product?.category_id || '',
  sub_category_id: product?.sub_category_id || '',
  brand_name: product?.brand_name || '',
  sub_brand_name: product?.sub_brand_name || '',
  stock_quantity: product?.stock_quantity || 0,
  is_active: product?.is_active ?? true,
});
```

#### 3. New UI Components
- **Brand Dropdown**: Searchable dropdown with "Add New" functionality
- **Sub-Brand Dropdown**: Dependent on brand selection with "Add New" functionality
- **Sub-Category Dropdown**: Dependent on category selection

### Brand Management Features

#### 1. Brand Creation
- Users can type a brand name and click "Add" to create new brands
- Real-time validation and error handling
- Automatic dropdown refresh after creation

#### 2. Sub-Brand Management
- Sub-brands are associated with specific brands
- Users must select a brand before creating/selecting sub-brands
- Unique sub-brand names across the entire database

#### 3. Category and Sub-Category Integration
- Sub-categories are now directly associated with categories
- Improved performance by removing junction table dependency

## Slug Generation Enhancement

### New Slug Format
- **Format**: Lowercase with hyphens (e.g., "Premium Engine Oil" → "premium-engine-oil")
- **Duplicate Handling**: Automatic numbering (e.g., "premium-engine-oil1", "premium-engine-oil2")
- **Improved Logic**: Better handling of special characters and multiple spaces

### Updated Function
```typescript
async function generateSlug(name: string): Promise<string> {
  // Convert to lowercase and replace spaces with hyphens
  const baseSlug = name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove all non-alphanumeric characters except hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens
  
  // Check for duplicates and add numbering
  // ... duplicate checking logic
}
```

## Type Definitions Updates

### New Interfaces
```typescript
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
```

### Updated Interfaces
```typescript
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
  brand_name: string;
  sub_brand_name?: string;
  image_1?: string | Buffer;
  image_2?: string | Buffer;
  image_3?: string | Buffer;
  image_4?: string | Buffer;
  images?: string[];
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  is_hot_deal: boolean;
  created_at: string;
  updated_at: string;
}
```

## Validation Updates

### Product Validation
- Added `brand_name` as required field
- Added validation for `sub_brand_name` and `sub_category_id`
- Updated field validation logic

### API Validation
- Updated allowed fields for product updates
- Enhanced error handling for new field types
- Improved validation messages

## Database Queries Updates

### Updated Product Queries
```sql
-- Create product with new structure
INSERT INTO products (
  product_id, dealer_id, name, slug, description, short_description, 
  sale_price, original_price, rating, image_1, image_2, image_3, image_4, 
  category_id, sub_category_id, brand_name, sub_brand_name, stock_quantity, 
  is_active, is_featured, is_hot_deal, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

-- Update product with new structure
UPDATE products 
SET name = ?, slug = ?, description = ?, short_description = ?, 
    sale_price = ?, original_price = ?, rating = ?, image_1 = ?, image_2 = ?, 
    image_3 = ?, image_4 = ?, category_id = ?, sub_category_id = ?, 
    brand_name = ?, sub_brand_name = ?, stock_quantity = ?, is_active = ?, 
    is_featured = ?, is_hot_deal = ?, updated_at = NOW()
WHERE product_id = ? AND dealer_id = ?
```

## Testing

### Test Script
Created `scripts/test-new-structure.js` to verify:
- Database table structure
- Brand and sub-brand operations
- Product creation with new fields
- Slug generation with duplicates
- API endpoint functionality

### Test Coverage
- ✅ Table structure validation
- ✅ Brand creation and retrieval
- ✅ Sub-brand creation and retrieval
- ✅ Category and sub-category operations
- ✅ Product creation with new structure
- ✅ Slug generation and duplicate handling
- ✅ API endpoint testing
- ✅ Data cleanup

## Migration Notes

### Required Actions
1. **Database Migration**: Execute the SQL commands to create new tables and modify existing ones
2. **Data Migration**: Migrate existing product data to new structure
3. **API Deployment**: Deploy updated API endpoints
4. **Frontend Deployment**: Deploy updated ProductForm component
5. **Testing**: Run the test script to verify functionality

### Backward Compatibility
- Existing product data will need migration to new structure
- API endpoints maintain backward compatibility where possible
- Frontend gracefully handles missing optional fields

## Benefits

### For Users
- **Better Organization**: Clear brand and sub-brand hierarchy
- **Improved Search**: Better categorization with sub-categories
- **Unique Identifiers**: SEO-friendly slugs with automatic duplicate handling
- **Flexible Branding**: Easy addition of new brands and sub-brands

### For Developers
- **Cleaner Structure**: Direct relationships instead of junction tables
- **Better Performance**: Reduced JOIN operations
- **Type Safety**: Comprehensive TypeScript interfaces
- **Maintainable Code**: Well-organized API structure

### For System
- **Scalability**: Better database design for growth
- **SEO Optimization**: Improved slug generation
- **Data Integrity**: Proper foreign key relationships
- **Performance**: Optimized queries and indexing

## Files Modified

### New Files
- `src/app/api/brands/route.ts`
- `src/app/api/sub-brands/route.ts`
- `scripts/test-new-structure.js`
- `reports-documentation/NEW_DATABASE_STRUCTURE_UPDATE.md`

### Updated Files
- `src/types/database.ts`
- `src/lib/api.ts`
- `src/lib/database.ts`
- `src/lib/validation.ts`
- `src/app/api/products/route.ts`
- `src/app/api/products/[id]/route.ts`
- `src/app/api/sub-categories/route.ts`
- `src/app/components/dashboard-components/ProductForm.tsx`

## Conclusion

This update provides a comprehensive solution for managing brands, sub-brands, and improved product categorization. The new structure is more scalable, user-friendly, and maintainable while providing better SEO capabilities through improved slug generation.


