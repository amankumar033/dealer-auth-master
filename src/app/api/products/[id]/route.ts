import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, queries } from '@/lib/database';
import { 
  validateRequestParams, 
  validateUpdateData, 
  formatErrorResponse,
  sanitizeVarcharId 
} from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealer_id');
    
    // Validate request parameters
    const paramValidation = validateRequestParams(
      { dealer_id: dealerId }, 
      ['dealer_id']
    );
    
    if (!paramValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid parameters',
        details: paramValidation.errors 
      }, { status: 400 });
    }
    
    const { id } = await params;
    const sanitizedId = sanitizeVarcharId(id);
    const sanitizedDealerId = paramValidation.sanitizedData!.dealer_id;
    
    if (!sanitizedId) {
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }
    
    const products = await executeQuery(queries.getProductById, [sanitizedId, sanitizedDealerId], 2, true) as any[];
    const product = products[0];
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Convert BLOB image to base64 for frontend display
    console.log('Processing product image:', product.product_id);
    console.log('Image data type:', typeof product.image);
    console.log('Image data:', product.image);
    
    // Convert any Buffer objects to strings to prevent React rendering errors
    // Skip image fields as they need special processing
    Object.keys(product).forEach(key => {
      const value = product[key];
      // Skip image fields - they will be processed separately
      if (key.startsWith('image_')) {
        return;
      }
      
      if (Buffer.isBuffer(value)) {
        console.log(`Converting Buffer field '${key}' to string`);
        product[key] = value.toString('utf8');
      } else if (typeof value === 'object' && value && value.type === 'Buffer') {
        console.log(`Converting Buffer object field '${key}' to string`);
        try {
          const buffer = Buffer.from(value.data);
          product[key] = buffer.toString('utf8');
        } catch (error) {
          console.error(`Error converting Buffer object field '${key}':`, error);
          product[key] = '';
        }
      }
    });
    
    // Use image_1 as the primary image since there's no 'image' column
    if (product.image_1) {
      try {
        // Handle raw Buffer (from MySQL BLOB field)
        if (Buffer.isBuffer(product.image_1)) {
          try {
            console.log('Converting raw Buffer to base64...');
            
            // It's actual image data, convert to base64
            const base64 = product.image_1.toString('base64');
              
            // Try to detect MIME type from the first few bytes
            const firstBytes = product.image_1.slice(0, 4);
            let mimeType = 'image/jpeg'; // default
            
            if (firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47) {
              mimeType = 'image/png';
            } else if (firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46) {
              mimeType = 'image/gif';
            } else if (firstBytes[0] === 0x52 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46 && firstBytes[3] === 0x46) {
              mimeType = 'image/webp';
            }
              
            product.image_1 = `data:${mimeType};base64,${base64}`;
            console.log('Successfully converted raw Buffer to base64, length:', base64.length, 'MIME type:', mimeType);
          } catch (error) {
            console.error('Error converting raw Buffer to base64:', error);
            product.image_1 = '';
          }
        }
        // Handle Buffer object (BLOB data)
        else if (typeof product.image_1 === 'object' && product.image_1.type === 'Buffer') {
          try {
            console.log('Converting Buffer object to base64...');
            const buffer = Buffer.from(product.image_1.data);
            
            // It's actual image data, convert to base64
            const base64 = buffer.toString('base64');
            const mimeType = 'image/jpeg'; // Default to JPEG
            product.image_1 = `data:${mimeType};base64,${base64}`;
            console.log('Successfully converted Buffer object to base64, length:', base64.length);
          } catch (error) {
            console.error('Error converting Buffer object to base64:', error);
            product.image_1 = '';
          }
        }
        // Handle string (already converted or URL)
        else if (typeof product.image_1 === 'string') {
          console.log('Image is already a string, length:', product.image_1.length);
          
          // Check if it's a JSON string that was incorrectly converted
          if (product.image_1.startsWith('[') && product.image_1.endsWith(']')) {
            try {
              console.log('Found JSON string, attempting to parse...');
              const imagesArray = JSON.parse(product.image_1);
              if (Array.isArray(imagesArray) && imagesArray.length > 0) {
                // Take the first image as the primary image
                product.image_1 = imagesArray[0];
                console.log('Successfully extracted first image from JSON array');
              }
            } catch (error) {
              console.error('Error parsing JSON string:', error);
            }
          }
          // Keep as is if it's already a data URL or URL
        }
        // Handle other types
        else {
          console.log('Unknown image data type:', typeof product.image_1);
          product.image_1 = '';
        }
      } catch (error) {
        console.error('Error processing product image:', error);
        product.image_1 = '';
      }
    }
    
    // Process additional images from image_2, image_3, image_4 columns
    const allImages = [product.image_1]; // Start with primary image
    
          // Process image_2, image_3, image_4 (image_1 is already processed as primary)
      for (let i = 2; i <= 4; i++) {
      const imageKey = `image_${i}`;
      const imageData = product[imageKey];
      
      if (imageData) {
        try {
          let imageBuffer: Buffer;
          
          // Handle raw Buffer (from MySQL BLOB field)
          if (Buffer.isBuffer(imageData)) {
            imageBuffer = imageData;
          }
          // Handle Buffer object (BLOB data)
          else if (typeof imageData === 'object' && imageData.type === 'Buffer') {
            imageBuffer = Buffer.from(imageData.data);
          }
          // Handle string (already converted or URL)
          else if (typeof imageData === 'string') {
            // Check if it's a JSON string that was incorrectly converted
            if (imageData.startsWith('[') && imageData.endsWith(']')) {
              try {
                const imagesArray = JSON.parse(imageData);
                if (Array.isArray(imagesArray) && imagesArray.length > 0) {
                  allImages.push(imagesArray[0]);
                }
              } catch (error) {
                console.error(`Error parsing JSON string for ${imageKey}:`, error);
              }
            } else {
              // Keep as is if it's already a data URL or URL
              allImages.push(imageData);
            }
            continue; // Skip base64 conversion for strings
          }
          else {
            continue; // Skip invalid image data
          }
          
          // Convert to base64
          const base64 = imageBuffer.toString('base64');
          const mimeType = 'image/jpeg'; // Default to JPEG
          const dataUrl = `data:${mimeType};base64,${base64}`;
          allImages.push(dataUrl);
          
        } catch (error) {
          console.error(`Error processing ${imageKey} for product ${product.product_id}:`, error);
        }
      }
    }
    
    product.images = allImages.filter(img => img && img !== ''); // Remove empty images
    console.log(`Found ${product.images.length} images for product ${product.product_id}`);
    
    // Add image field for backward compatibility (use image_1 as primary)
    product.image = product.image_1 || '';
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error('Database error:', error);
    const errorResponse = formatErrorResponse(error, 'Product GET API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dealer_id = searchParams.get('dealer_id');
    
    console.log('🔍 PUT Product Debug - URL params:', { dealer_id, url: request.url });
    
    // Validate request parameters
    const paramValidation = validateRequestParams(
      { dealer_id }, 
      ['dealer_id']
    );
    
    console.log('🔍 Param validation result:', paramValidation);
    
    if (!paramValidation.isValid) {
      console.log('❌ Parameter validation failed:', paramValidation.errors);
      return NextResponse.json({ 
        error: 'Invalid parameters',
        details: paramValidation.errors 
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { id } = await params;
    
    console.log('🔍 Request body:', body);
    console.log('🔍 Product ID:', id);
    
    const sanitizedId = sanitizeVarcharId(id);
    const sanitizedDealerId = paramValidation.sanitizedData!.dealer_id;
    
    console.log('🔍 Sanitized IDs:', { sanitizedId, sanitizedDealerId });
    
    if (!sanitizedId) {
      console.log('❌ Invalid product ID format:', id);
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }
    
    // Validate update data - dealer_id should NOT be allowed to be updated
    const allowedFields = [
      'name', 'description', 'short_description', 'sale_price', 'original_price', 'rating', 
      'image', 'image_1', 'image_2', 'image_3', 'image_4', 'images', 'category_id', 'sub_category_id', 'brand_name', 'sub_brand_name', 'manufacture', 'stock_quantity', 'is_active', 
      'is_featured', 'is_hot_deal'
      // Note: dealer_id is intentionally NOT included - it should never be updated
    ];
    
    const updateValidation = validateUpdateData(body, allowedFields);
    console.log('🔍 Update validation result:', updateValidation);
    
    if (!updateValidation.isValid) {
      console.log('❌ Update validation failed:', updateValidation.errors);
      return NextResponse.json({ 
        error: 'Invalid update data',
        details: updateValidation.errors 
      }, { status: 400 });
    }
    
    // Check if product exists
    const existingProducts = await executeQuery(queries.getProductById, [sanitizedId, sanitizedDealerId], 2, true) as any[];
    console.log('🔍 Existing products found:', existingProducts?.length || 0);
    
    if (!existingProducts || existingProducts.length === 0) {
      console.log('❌ Product not found:', { sanitizedId, sanitizedDealerId });
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const existingProduct = existingProducts[0];
    console.log('🔍 Existing product:', existingProduct);
    
    // CRITICAL: When updating a product, we should NEVER change the dealer_id
    // The dealer_id should remain the same as the existing product
    // The dealer_id in the URL is only used for authorization/validation
    
    // Prepare update parameters with proper defaults
    const updateData = updateValidation.sanitizedData!;
    
    // Process image data - handle both single image and multiple images
    let image1Data = existingProduct.image_1; // Default to existing image_1
    let image2Data = existingProduct.image_2; // Default to existing image_2
    let image3Data = existingProduct.image_3; // Default to existing image_3
    let image4Data = existingProduct.image_4; // Default to existing image_4
    
    if (updateData.images && Array.isArray(updateData.images) && updateData.images.length > 0) {
      // Multiple images - process each one (max 4 images)
      console.log('Products API PUT: Processing multiple images:', updateData.images.length);
      console.log('🔍 Images data:', updateData.images.map((img: any, i: number) => `Image ${i}: ${typeof img} - ${img?.substring(0, 50)}...`));
      
      const processedImages: Buffer[] = [];
      for (const imageString of updateData.images as any[]) {
        console.log('🔍 Processing image:', typeof imageString, imageString?.substring(0, 50));
        if (typeof imageString === 'string' && imageString.startsWith('data:image/')) {
          // Convert base64 to Buffer for BLOB storage
          const base64Data = imageString.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          const imageBuffer = Buffer.from(base64Data, 'base64');
          processedImages.push(imageBuffer);
          console.log('🔍 Image processed successfully, buffer length:', imageBuffer.length);
        } else {
          console.log('🔍 Image skipped - not a valid data URL');
        }
      }
      
      // Assign images to columns (max 4)
      if (processedImages.length > 0) {
        image1Data = processedImages[0]; // Primary image goes to image_1
        console.log('🔍 Image 1 assigned, length:', processedImages[0]?.length);
        if (processedImages.length > 1) {
          image2Data = processedImages[1];
          console.log('🔍 Image 2 assigned, length:', processedImages[1]?.length);
        }
        if (processedImages.length > 2) {
          image3Data = processedImages[2];
          console.log('🔍 Image 3 assigned, length:', processedImages[2]?.length);
        }
        if (processedImages.length > 3) {
          image4Data = processedImages[3];
          console.log('🔍 Image 4 assigned, length:', processedImages[3]?.length);
        }
        console.log('🔍 Total images processed:', processedImages.length);
      }
    } else if (updateData.image) {
      if (typeof updateData.image === 'string' && updateData.image.startsWith('data:image/')) {
        // Convert base64 to Buffer for BLOB storage
        const base64Data = updateData.image.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        image1Data = Buffer.from(base64Data, 'base64');
      } else {
        image1Data = updateData.image;
      }
      console.log('Products API PUT: Processing single image');
    }
    
    const updateParams = [
      updateData.name ?? existingProduct.name,
      updateData.slug ?? existingProduct.slug, // Add missing slug parameter
      updateData.description ?? existingProduct.description,
      updateData.short_description ?? existingProduct.short_description,
      updateData.sale_price ?? existingProduct.sale_price,
      updateData.original_price ?? updateData.sale_price ?? existingProduct.original_price,
      updateData.rating ?? existingProduct.rating ?? 0,
      image1Data,
      image2Data,
      image3Data,
      image4Data,
      updateData.category_id ?? existingProduct.category_id, // Preserve existing category_id
      updateData.sub_category_id ?? existingProduct.sub_category_id, // Handle sub-category
      updateData.brand_name ?? existingProduct.brand_name, // Handle brand_name
      updateData.sub_brand_name ?? existingProduct.sub_brand_name, // Handle sub_brand_name
      updateData.manufacture ?? existingProduct.manufacture, // Handle manufacturer
      updateData.stock_quantity ?? existingProduct.stock_quantity ?? 0,
      updateData.is_active ?? existingProduct.is_active ?? true,
      updateData.is_featured ?? existingProduct.is_featured ?? false,
      updateData.is_hot_deal ?? existingProduct.is_hot_deal ?? false,
      sanitizedId, 
      existingProduct.dealer_id // Use existing dealer_id, NOT the one from URL params
    ];
    
    // Log the parameters for debugging
    console.log('Update parameters:', updateParams.map((param, index) => 
      `${index}: ${param} (${typeof param})`
    ));
    
    // Validate that we have at least one field to update
    const hasUpdateData = updateParams.slice(0, -2).some(param => param !== null);
    if (!hasUpdateData) {
      return NextResponse.json({ 
        error: 'No valid fields provided for update',
        details: 'At least one field must be provided and not null'
      }, { status: 400 });
    }
    
    // Log the parameters for debugging
    console.log('🔍 Update parameters:', updateParams.map((param, index) => 
      `${index}: ${param} (${typeof param})`
    ));
    
    // Update product
    await executeQuery(queries.updateProduct, updateParams);
    console.log('✅ Product updated successfully');
    

    
    // Get updated product
    const updatedProducts = await executeQuery(queries.getProductById, [sanitizedId, sanitizedDealerId], 2, true) as any[];
    const updatedProduct = updatedProducts[0];
    
    // Process the image_1 data to convert BLOB to data URL
    if (updatedProduct.image_1) {
      if (Buffer.isBuffer(updatedProduct.image_1)) {
        try {
          const base64 = updatedProduct.image_1.toString('base64');
          const mimeType = 'image/jpeg'; // Default to JPEG
          updatedProduct.image_1 = `data:${mimeType};base64,${base64}`;
          console.log('Products API PUT: Converted BLOB to data URL');
        } catch (error) {
          console.error('Products API PUT: Error converting BLOB to data URL:', error);
          updatedProduct.image_1 = '';
        }
      } else if (typeof updatedProduct.image_1 === 'object' && updatedProduct.image_1.type === 'Buffer') {
        try {
          const buffer = Buffer.from(updatedProduct.image_1.data);
          const base64 = buffer.toString('base64');
          const mimeType = 'image/jpeg'; // Default to JPEG
          updatedProduct.image_1 = `data:${mimeType};base64,${base64}`;
          console.log('Products API PUT: Converted Buffer object to data URL');
        } catch (error) {
          console.error('Products API PUT: Error converting Buffer object to data URL:', error);
          updatedProduct.image_1 = '';
        }
      }
    }
    
    // Process additional images from image_2, image_3, image_4 columns
    const allImages = [updatedProduct.image_1]; // Start with primary image
    
          // Process image_2, image_3, image_4 (image_1 is already processed as primary)
      for (let i = 2; i <= 4; i++) {
      const imageKey = `image_${i}`;
      const imageData = updatedProduct[imageKey];
      
      if (imageData) {
        try {
          let imageBuffer: Buffer;
          
          // Handle raw Buffer (from MySQL BLOB field)
          if (Buffer.isBuffer(imageData)) {
            imageBuffer = imageData;
          }
          // Handle Buffer object (BLOB data)
          else if (typeof imageData === 'object' && imageData.type === 'Buffer') {
            imageBuffer = Buffer.from(imageData.data);
          }
          // Handle string (already converted or URL)
          else if (typeof imageData === 'string') {
            // Check if it's a JSON string that was incorrectly converted
            if (imageData.startsWith('[') && imageData.endsWith(']')) {
              try {
                const imagesArray = JSON.parse(imageData);
                if (Array.isArray(imagesArray) && imagesArray.length > 0) {
                  allImages.push(imagesArray[0]);
                }
              } catch (error) {
                console.error(`Error parsing JSON string for ${imageKey}:`, error);
              }
            } else {
              // Keep as is if it's already a data URL or URL
              allImages.push(imageData);
            }
            continue; // Skip base64 conversion for strings
          }
          else {
            continue; // Skip invalid image data
          }
          
          // Convert to base64
          const base64 = imageBuffer.toString('base64');
          const mimeType = 'image/jpeg'; // Default to JPEG
          const dataUrl = `data:${mimeType};base64,${base64}`;
          allImages.push(dataUrl);
          
        } catch (error) {
          console.error(`Error processing ${imageKey} for product ${sanitizedId}:`, error);
        }
      }
    }
    
    updatedProduct.images = allImages.filter(img => img && img !== ''); // Remove empty images
    console.log(`Products API PUT: Added ${updatedProduct.images.length} images to response`);
    
    // Add image field for backward compatibility (use image_1 as primary)
    updatedProduct.image = updatedProduct.image_1 || '';
    
    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('❌ Database error:', error);
    const errorResponse = formatErrorResponse(error, 'Product PUT API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealer_id');
    
    // Validate request parameters
    const paramValidation = validateRequestParams(
      { dealer_id: dealerId }, 
      ['dealer_id']
    );
    
    if (!paramValidation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid parameters',
        details: paramValidation.errors 
      }, { status: 400 });
    }
    
    const { id } = await params;
    const sanitizedId = sanitizeVarcharId(id);
    const sanitizedDealerId = paramValidation.sanitizedData!.dealer_id;
    
    if (!sanitizedId) {
      return NextResponse.json({ error: 'Invalid product ID format' }, { status: 400 });
    }
    
    // Check if product exists
    console.log('🔍 Checking if product exists:', { sanitizedId, sanitizedDealerId });
    const existingProducts = await executeQuery(queries.getProductById, [sanitizedId, sanitizedDealerId], 2, true) as any[];
    console.log('🔍 Existing products found:', existingProducts?.length || 0);
    
    if (!existingProducts || existingProducts.length === 0) {
      console.log('❌ Product not found, checking with direct query...');
      // Try a direct query to see if the product exists
      const directCheck = await executeQuery('SELECT product_id FROM products WHERE product_id = ? AND dealer_id = ?', [sanitizedId, sanitizedDealerId]) as any[];
      console.log('🔍 Direct check result:', directCheck?.length || 0);
      
      if (!directCheck || directCheck.length === 0) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
    }
    
    // Delete related orders first (cascading delete)
    console.log('🗑️ Deleting related orders for product:', sanitizedId);
    await executeQuery(queries.deleteOrdersByProduct, [sanitizedId, sanitizedDealerId]);
    
    // Delete product
    console.log('🗑️ Deleting product:', sanitizedId);
    await executeQuery(queries.deleteProduct, [sanitizedId, sanitizedDealerId]);
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    const errorResponse = formatErrorResponse(error, 'Product DELETE API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 