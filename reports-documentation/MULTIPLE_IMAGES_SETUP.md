# Multiple Images Setup Guide

This guide explains how to set up and use the new multiple images feature for products.

## Database Migration

### 1. Run the Migration Script

Execute the following SQL commands in your database to create the `product_images` table:

```sql
-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_is_primary (is_primary),
  INDEX idx_sort_order (sort_order)
);

-- Add unique constraint to ensure only one primary image per product
ALTER TABLE product_images 
ADD CONSTRAINT unique_primary_per_product 
UNIQUE (product_id, is_primary);

-- Migrate existing single images to the new table
INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
SELECT 
  product_id, 
  image, 
  TRUE, 
  0
FROM products 
WHERE image IS NOT NULL AND image != '';
```

### 2. Verify Migration

Check that the migration was successful:

```sql
-- Check if table was created
DESCRIBE product_images;

-- Check if existing images were migrated
SELECT COUNT(*) FROM product_images;
```

## Features

### ✅ Multiple Image Support
- Upload multiple images per product
- Drag and drop interface
- File type validation (images only)
- File size validation (max 5MB per file)
- Preview grid with remove functionality
- Primary image designation

### ✅ Modern UI
- Drag and drop upload area
- Image preview grid
- Remove individual images
- Primary image indicator
- Responsive design

### ✅ Backward Compatibility
- Existing single image products continue to work
- Automatic migration of existing images
- Fallback to single image if no multiple images

## Usage

### Adding Images
1. Navigate to the product add/edit form
2. In the "Product Images" section, either:
   - Drag and drop images onto the upload area
   - Click "Choose Files" to browse and select images
3. Images will be uploaded and displayed in a preview grid
4. The first image uploaded becomes the primary image
5. Hover over images to see the remove button

### Managing Images
- **Remove Image**: Hover over an image and click the red X button
- **Primary Image**: The first image in the list is automatically set as primary
- **Reorder**: Currently, images are ordered by upload time (first uploaded = primary)

## API Endpoints

### Upload Images
```
POST /api/upload
Content-Type: multipart/form-data

Body: FormData with 'files' field containing image files
Response: { urls: string[], message: string }
```

### Product with Images
```
GET /api/products/[id]?dealer_id=[dealer_id]
Response: { product: { ...product, images: [...] } }
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/
│   │   │   └── route.ts          # Image upload endpoint
│   │   └── products/
│   │       ├── route.ts          # Updated to handle multiple images
│   │       └── [id]/
│   │           └── route.ts      # Updated to handle multiple images
│   └── components/
│       └── dashboard-components/
│           └── ProductForm.tsx   # Updated with multiple image UI
├── lib/
│   └── database.ts               # Added product image queries
└── types/
    └── database.ts               # Added ProductImage interface
```

## Configuration

### Image Upload Settings
- **Max File Size**: 5MB per image
- **Allowed Types**: All image formats (image/*)
- **Storage**: Currently generates local URLs (can be extended to cloud storage)

### Database Settings
- **Table**: `product_images`
- **Foreign Key**: Links to `products.product_id`
- **Cascade Delete**: Images are deleted when product is deleted
- **Primary Image**: Only one primary image per product

## Future Enhancements

### Cloud Storage Integration
To use cloud storage (recommended for production):

1. **AWS S3**: Update `/api/upload/route.ts` to upload to S3
2. **Cloudinary**: Use Cloudinary's upload API
3. **Google Cloud Storage**: Use GCS upload functionality

### Image Optimization
- Add image resizing and compression
- Generate thumbnails
- WebP format conversion

### Advanced Features
- Image reordering (drag and drop)
- Bulk image operations
- Image cropping and editing
- Alt text for accessibility

## Troubleshooting

### Common Issues

1. **Migration Fails**
   - Check foreign key constraints
   - Ensure products table exists
   - Verify database permissions

2. **Upload Fails**
   - Check file size limits
   - Verify file type
   - Check server storage permissions

3. **Images Not Displaying**
   - Verify image URLs are accessible
   - Check CORS settings
   - Ensure proper file permissions

### Debug Commands

```sql
-- Check product images
SELECT p.name, pi.* 
FROM products p 
LEFT JOIN product_images pi ON p.product_id = pi.product_id 
WHERE p.dealer_id = [your_dealer_id];

-- Check for orphaned images
SELECT * FROM product_images 
WHERE product_id NOT IN (SELECT product_id FROM products);
```

## Support

For issues or questions:
1. Check the browser console for JavaScript errors
2. Check server logs for API errors
3. Verify database connectivity
4. Ensure all migration steps were completed 