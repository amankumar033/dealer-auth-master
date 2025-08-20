import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, queries, generateProductId, generateSlug } from '@/lib/database';
import { 
  validateProductData, 
  formatErrorResponse 
} from '@/lib/validation';
import { getIndiaTimestamp } from '@/lib/utils';

// ProductRaw interface moved to module scope for use in both GET and POST
interface ProductRaw {
  [key: string]: any;
  product_id?: string;
  dealer_id?: string;
  name?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  sale_price?: number;
  original_price?: number;
  rating?: number;
  image_1?: Buffer | { type: 'Buffer'; data: number[] } | string | null;
  image_2?: Buffer | { type: 'Buffer'; data: number[] } | string | null;
  image_3?: Buffer | { type: 'Buffer'; data: number[] } | string | null;
  image_4?: Buffer | { type: 'Buffer'; data: number[] } | string | null;
  category_id?: string;
  sub_category_id?: string;
  brand_name?: string;
  sub_brand_name?: string;
  manufacture?: string;
  stock_quantity?: number;
  is_active?: boolean;
  is_featured?: boolean;
  is_hot_deal?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealer_id');
    const categoryId = searchParams.get('category_id');
    const showAll = searchParams.get('show_all') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const includeImages = searchParams.get('include_images') !== 'false'; // Default to true for backward compatibility
    
    console.log('🔍 Debug: Products API GET request');
    console.log('  - dealerId:', dealerId);
    console.log('  - categoryId:', categoryId);
    console.log('  - showAll:', showAll);
    
    let query = queries.getProducts;
    let params = [dealerId || ''];

    if (categoryId) {
      if (showAll) {
        // Get all products in this category (for all dealers)
        query = queries.getAllProductsByCategory;
        params = [categoryId];
        console.log('  - Using getAllProductsByCategory query');
      } else {
        // Get products in this category for specific dealer
        if (!dealerId) {
          console.log('  - Error: dealer_id is required when not using show_all');
          return NextResponse.json({ error: 'dealer_id is required when not using show_all' }, { status: 400 });
        }
        query = queries.getProductsByCategory;
        params = [dealerId, categoryId];
        console.log('  - Using getProductsByCategory query');
      }
    } else if (!showAll && !dealerId) {
      console.log('  - Error: dealer_id is required when not using show_all');
      return NextResponse.json({ error: 'dealer_id is required when not using show_all' }, { status: 400 });
    }

    // Add pagination to the query
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    console.log('  - Final query:', query);
    console.log('  - Final params:', params);

    console.log('  - Executing database query...');
    let products: ProductRaw[];
    try {
      const result = await executeQuery(query, params, 2, true);
      // Ensure products is always an array
      if (!Array.isArray(result)) {
        products = [];
      } else {
        products = result as ProductRaw[];
      }
      console.log('  - Query executed successfully, products count:', products.length);
    } catch (error) {
      console.error('  - Database query failed:', error);
      throw error;
    }


    
    // Process products to handle BLOB images

    interface ProductProcessed extends ProductRaw {
      images: string[];
      image: string;
      image_1: string;
      image_2?: string;
      image_3?: string;
      image_4?: string;
    }

    const processedProducts: ProductProcessed[] = await Promise.all(products.map(async (product: ProductRaw): Promise<ProductProcessed> => {
      // Convert any Buffer objects to strings to prevent React rendering errors
      // Skip image fields as they need special processing
      Object.keys(product).forEach((key: string) => {
        const value = product[key];
        // Skip image fields - they will be processed separately
        if (key.startsWith('image_')) {
          return;
        }
        
        if (Buffer.isBuffer(value)) {
          product[key] = value.toString('utf8');
        } else if (typeof value === 'object' && value && value.type === 'Buffer') {
          try {
            const buffer = Buffer.from(value.data);
            product[key] = buffer.toString('utf8');
          } catch (error) {
            console.error(`Error converting Buffer object field '${key}':`, error);
            product[key] = '';
          }
        }
      });
      
      // Skip image processing if not needed
      if (!includeImages) {
        product.image_1 = '';
        product.images = [];
        product.image = '';
        return product as ProductProcessed;
      }
      
      // Use image_1 as the primary image since there's no 'image' column
      if (product.image_1) {
        // Handle raw Buffer (from MySQL BLOB field)
        if (Buffer.isBuffer(product.image_1)) {
          try {
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
          } catch (error) {
            console.error('Error converting raw Buffer to base64:', error);
            product.image_1 = '';
          }
        }
        // Handle Buffer object (BLOB data)
        else if (typeof product.image_1 === 'object' && product.image_1.type === 'Buffer') {
          try {
            const buffer = Buffer.from(product.image_1.data);
            
            // It's actual image data, convert to base64
            const base64 = buffer.toString('base64');
            const mimeType = 'image/jpeg'; // Default to JPEG
            product.image_1 = `data:${mimeType};base64,${base64}`;
          } catch (error) {
            console.error('Error converting Buffer object to base64:', error);
            product.image_1 = '';
          }
        }
        // Handle string (already converted or URL)
        else if (typeof product.image_1 === 'string') {
          // Check if it's a JSON string that was incorrectly converted
          if (product.image_1.startsWith('[') && product.image_1.endsWith(']')) {
            try {
              const imagesArray = JSON.parse(product.image_1);
              if (Array.isArray(imagesArray) && imagesArray.length > 0) {
                // Take the first image as the primary image
                product.image_1 = imagesArray[0];
              }
            } catch (error) {
              console.error('Error parsing JSON string:', error);
            }
          }
          // Keep as is if it's already a data URL or URL
        }
        // Handle other types
        else {
          product.image_1 = '';
        }
      } else {
        product.image_1 = '';
      }
      
      // Process additional images from image_1, image_2, image_3, image_4 columns
      const allImages: string[] = [typeof product.image_1 === 'string' ? product.image_1 : '']; // Start with primary image
      
      // Process image_2, image_3, image_4 (image_1 is already processed as primary)
      for (let i = 2; i <= 4; i++) {
        const imageKey = `image_${i}` as keyof ProductRaw;
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
      
      // Add image field for backward compatibility (use image_1 as primary)
      product.image = product.image_1 || '';
      
      return product as ProductProcessed;
    }));
    
    // Get total count for pagination
    let totalCount = 0;
    try {
      let countQuery = 'SELECT COUNT(*) as total FROM products';
      let countParams: any[] = [];
      
      if (categoryId) {
        if (showAll) {
          countQuery += ' WHERE category_id = ?';
          countParams = [categoryId];
        } else {
          countQuery += ' WHERE dealer_id = ? AND category_id = ?';
          countParams = [dealerId, categoryId];
        }
      } else if (!showAll) {
        countQuery += ' WHERE dealer_id = ?';
        countParams = [dealerId];
      }
      
      const countResult = await executeQuery(countQuery, countParams, 2, false) as any[];
      totalCount = countResult[0]?.total || 0;
    } catch (error) {
      console.error('Error getting total count:', error);
    }
    
    return NextResponse.json({
      products: processedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    const errorResponse = formatErrorResponse(error, 'Products GET API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Products API POST: Received request body:', body);
    
    // Validate product data using comprehensive validation
    const validation = validateProductData(body);
    if (!validation.isValid) {
      console.error('Products API POST: Validation failed:', validation.errors);
      return NextResponse.json({ 
        error: 'Invalid product data',
        details: validation.errors 
      }, { status: 400 });
    }
    
    const sanitizedData = validation.sanitizedData!;
    console.log('Products API POST: Sanitized data:', sanitizedData);

    // Process image data - handle both single image and multiple images
    let image1Data: Buffer | null = null;
    let image2Data: Buffer | null = null;
    let image3Data: Buffer | null = null;
    let image4Data: Buffer | null = null;
    
    if (sanitizedData.images && Array.isArray(sanitizedData.images) && sanitizedData.images.length > 0) {
      // Multiple images - process each one (max 4 images)
      console.log('Products API POST: Processing multiple images:', sanitizedData.images.length);
      console.log('🔍 POST Images data:', sanitizedData.images.map((img: string, i: number) => `Image ${i}: ${typeof img} - ${img?.substring(0, 50)}...`));
      
      const processedImages: Buffer[] = [];
      for (const imageString of sanitizedData.images) {
        console.log('🔍 POST Processing image:', typeof imageString, imageString?.substring(0, 50));
        if (typeof imageString === 'string' && imageString.startsWith('data:image/')) {
          // Convert base64 to Buffer for BLOB storage
          const base64Data = imageString.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          const imageBuffer = Buffer.from(base64Data, 'base64');
          processedImages.push(imageBuffer);
          console.log('🔍 POST Image processed successfully, buffer length:', imageBuffer.length);
        } else {
          console.log('🔍 POST Image skipped - not a valid data URL');
        }
      }
      
      // Assign images to columns (max 4)
      if (processedImages.length > 0) {
        image1Data = processedImages[0]; // Primary image goes to image_1
        console.log('🔍 POST: Image 1 assigned, length:', processedImages[0]?.length);
        if (processedImages.length > 1) {
          image2Data = processedImages[1];
          console.log('🔍 POST: Image 2 assigned, length:', processedImages[1]?.length);
        }
        if (processedImages.length > 2) {
          image3Data = processedImages[2];
          console.log('🔍 POST: Image 3 assigned, length:', processedImages[2]?.length);
        }
        if (processedImages.length > 3) {
          image4Data = processedImages[3];
          console.log('🔍 POST: Image 4 assigned, length:', processedImages[3]?.length);
        }
        console.log('🔍 POST: Total images processed:', processedImages.length);
      }
    } else if (typeof sanitizedData.image === 'string') {
      if (sanitizedData.image.startsWith('data:image/')) {
        // Convert base64 to Buffer for BLOB storage
        const base64Data = sanitizedData.image.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        image1Data = Buffer.from(base64Data, 'base64');
      } else {
        image1Data = sanitizedData.image;
      }
      console.log('Products API POST: Processing single image');
    }

    // Generate custom product ID based on dealer
    let productId;
    try {
      productId = await generateProductId(sanitizedData.dealer_id);
      console.log('Products API POST: Generated product ID:', productId);
    } catch (idError) {
      console.error('Products API POST: Error generating product ID:', idError);
      return NextResponse.json({ 
        error: 'Failed to generate product ID', 
        details: idError instanceof Error ? idError.message : 'Unknown error' 
      }, { status: 500 });
    }

    // Generate unique slug from product name
    let slug;
    try {
      slug = await generateSlug(sanitizedData.name);
      console.log('Products API POST: Generated unique slug:', slug);
    } catch (slugError) {
      console.error('Products API POST: Error generating slug:', slugError);
      return NextResponse.json({ error: 'Failed to generate unique slug' }, { status: 500 });
    }

    // Validate and create sub-brand if it doesn't exist
    if (sanitizedData.sub_brand_name && sanitizedData.brand_name) {
      try {
        console.log('Products API POST: Checking if sub-brand exists:', sanitizedData.sub_brand_name);
        
        // Check if sub-brand exists
        const existingSubBrands = await executeQuery(
          'SELECT * FROM sub_brands WHERE sub_brand_name = ? AND brand_name = ?',
          [sanitizedData.sub_brand_name, sanitizedData.brand_name],
          2,
          false
        ) as any[];
        
        if (!existingSubBrands || existingSubBrands.length === 0) {
          console.log('Products API POST: Sub-brand does not exist, creating it...');
          
          // Create the sub-brand
          await executeQuery(
            'INSERT INTO sub_brands (sub_brand_name, brand_name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
            [sanitizedData.sub_brand_name, sanitizedData.brand_name],
            2,
            false
          );
          
          console.log('Products API POST: Sub-brand created successfully');
        } else {
          console.log('Products API POST: Sub-brand already exists');
        }
      } catch (subBrandError) {
        console.error('Products API POST: Error handling sub-brand:', subBrandError);
        return NextResponse.json({ error: 'Failed to validate/create sub-brand' }, { status: 500 });
      }
    }

    // Validate and create sub-category if it doesn't exist
    if (sanitizedData.sub_category_id && sanitizedData.category_id) {
      try {
        console.log('Products API POST: Checking if sub-category exists:', sanitizedData.sub_category_id);
        
        // Check if sub-category exists
        const existingSubCategories = await executeQuery(
          'SELECT * FROM sub_categories WHERE sub_category_id = ? AND category_id = ?',
          [sanitizedData.sub_category_id, sanitizedData.category_id],
          2,
          false
        ) as any[];
        
        if (!existingSubCategories || existingSubCategories.length === 0) {
          console.log('Products API POST: Sub-category does not exist, skipping sub-category assignment');
          // Set sub_category_id to null to avoid foreign key constraint error
          sanitizedData.sub_category_id = null;
        } else {
          console.log('Products API POST: Sub-category already exists');
        }
      } catch (subCategoryError) {
        console.error('Products API POST: Error handling sub-category:', subCategoryError);
        // Set sub_category_id to null to avoid foreign key constraint error
        sanitizedData.sub_category_id = null;
      }
    }
    
    console.log('Products API POST: Creating product with params:', [
      productId, 
      sanitizedData.dealer_id,
      sanitizedData.name, 
      slug,
      sanitizedData.description, 
      sanitizedData.short_description,
      sanitizedData.sale_price, 
      sanitizedData.original_price, 
      sanitizedData.rating, 
      image1Data, 
      image2Data, 
      image3Data, 
      image4Data, 
      sanitizedData.category_id,
      sanitizedData.brand_name, 
      sanitizedData.sub_brand_name,
      sanitizedData.stock_quantity, 
      sanitizedData.is_active, 
      sanitizedData.is_featured,
      sanitizedData.is_hot_deal
    ]);
    
    // Debug: Log all parameters being passed
    const insertParams = [
      productId, 
      sanitizedData.dealer_id,
      sanitizedData.name, 
      slug,
      sanitizedData.description, 
      sanitizedData.short_description,
      sanitizedData.sale_price, 
      sanitizedData.original_price, 
      sanitizedData.rating, 
      image1Data, 
      image2Data, 
      image3Data, 
      image4Data, 
      sanitizedData.category_id,
      sanitizedData.sub_category_id || null, // Handle optional sub-category
      sanitizedData.brand_name, 
      sanitizedData.sub_brand_name || null, // Handle optional sub-brand
      sanitizedData.manufacture || null, // Handle optional manufacturer
      sanitizedData.stock_quantity, 
      sanitizedData.is_active, 
      sanitizedData.is_featured,
      sanitizedData.is_hot_deal
      // Note: created_at and updated_at are handled by NOW() in the database query
    ];
    
    console.log('🔍 Insert parameters count:', insertParams.length);
    console.log('🔍 Insert parameters:', insertParams.map((param, index) => `${index + 1}: ${param} (${typeof param})`));
    
    try {
      const result = await executeQuery(queries.createProduct, insertParams);
      console.log('Products API POST: Product created successfully:', result);
    } catch (createError) {
      console.error('Products API POST: Error creating product:', createError);
      return NextResponse.json({ error: 'Failed to create product in database' }, { status: 500 });
    }
    
    // Get the created product using the custom product ID
    try {
      const products = await executeQuery('SELECT * FROM products WHERE product_id = ?', [productId], 2, true) as ProductRaw[];
      const newProduct = products[0];
      console.log('Products API POST: Retrieved created product:', newProduct);
      
      if (!newProduct) {
        console.error('Products API POST: Product not found after creation');
        return NextResponse.json({ error: 'Product created but not found' }, { status: 500 });
      }
      
      // Process the image_1 data to convert BLOB to data URL
      if (newProduct.image_1) {
        if (Buffer.isBuffer(newProduct.image_1)) {
          try {
            const base64 = newProduct.image_1.toString('base64');
            const mimeType = 'image/jpeg'; // Default to JPEG
            newProduct.image_1 = `data:${mimeType};base64,${base64}`;
            console.log('Products API POST: Converted BLOB to data URL');
          } catch (error) {
            console.error('Products API POST: Error converting BLOB to data URL:', error);
            newProduct.image_1 = '';
          }
        } else if (typeof newProduct.image_1 === 'object' && newProduct.image_1.type === 'Buffer') {
          try {
            const buffer = Buffer.from(newProduct.image_1.data);
            const base64 = buffer.toString('base64');
            const mimeType = 'image/jpeg'; // Default to JPEG
            newProduct.image_1 = `data:${mimeType};base64,${base64}`;
            console.log('Products API POST: Converted Buffer object to data URL');
          } catch (error) {
            console.error('Products API POST: Error converting Buffer object to data URL:', error);
            newProduct.image_1 = '';
          }
        }
      }
      
      // Process additional images from image_2, image_3, image_4 columns
      const allImages = [newProduct.image_1]; // Start with primary image
      
      // Process image_2, image_3, image_4 (image_1 is already processed as primary)
      for (let i = 2; i <= 4; i++) {
        const imageKey = `image_${i}`;
        const imageData = newProduct[imageKey];
        
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
            console.error(`Error processing ${imageKey} for product ${productId}:`, error);
          }
        }
      }
      
      newProduct.images = allImages.filter(img => img && img !== ''); // Remove empty images
      console.log(`Products API POST: Added ${newProduct.images.length} images to response`);
      
      // Add image field for backward compatibility (use image_1 as primary)
      newProduct.image = newProduct.image_1 || '';
      
      // Send notification to admin about new product creation
      try {
        await sendProductCreationNotification({
          productId: newProduct.product_id || '',
          productName: newProduct.name || '',
          dealerId: newProduct.dealer_id || '',
          images: newProduct.images,
          productData: newProduct
        });
        console.log('Products API POST: Notification sent successfully');
      } catch (notificationError) {
        console.error('Products API POST: Failed to send notification:', notificationError);
        // Don't fail the request if notification fails
      }
      
      return NextResponse.json({ product: newProduct }, { status: 201 });
    } catch (retrieveError) {
      console.error('Products API POST: Error retrieving created product:', retrieveError);
      return NextResponse.json({ error: 'Product created but failed to retrieve' }, { status: 500 });
    }
  } catch (error) {
    console.error('Products API POST: Unexpected error:', error);
    const errorResponse = formatErrorResponse(error, 'Products POST API');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// Helper function to send product creation notification
async function sendProductCreationNotification(params: {
  productId: string;
  productName: string;
  dealerId: string;
  images: string[];
  productData: any;
}) {
  try {
    // Store notification in database
    const notificationData = {
      type: 'product_created',
      title: 'New Product Added',
      message: `Product "${params.productName}" was created by dealer ${params.dealerId}`,
      description: `A new product "${params.productName}" has been successfully created by dealer ${params.dealerId}. This product is now available in the system and can be managed through the admin panel. The product includes detailed specifications, pricing information, and inventory details. Please review the product information and ensure all details are accurate before making it available to customers.`,
      for_admin: 1,
      for_dealer: 0,
      for_user: 0,
      for_vendor: 0,
      product_id: params.productId,
      metadata: JSON.stringify({
        product_id: params.productId,
        product_name: params.productName,
        dealer_id: params.dealerId,
        action_url: `/admin/products/${params.productId}`,
        // Include all product data in original form (without images)
        product_data: {
          name: params.productData.name,
          slug: params.productData.slug,
          description: params.productData.description,
          short_description: params.productData.short_description,
          sale_price: params.productData.sale_price,
          original_price: params.productData.original_price,
          rating: params.productData.rating,
          category_id: params.productData.category_id,
          sub_category_id: params.productData.sub_category_id,
          brand_name: params.productData.brand_name,
          sub_brand_name: params.productData.sub_brand_name,
          stock_quantity: params.productData.stock_quantity,
          is_active: params.productData.is_active,
          is_featured: params.productData.is_featured,
          is_hot_deal: params.productData.is_hot_deal,
          image_count: params.images.length,
          created_at: params.productData.created_at,
          updated_at: params.productData.updated_at
        }
      })
    };
    
    const indiaTime = getIndiaTimestamp();
    const result = await executeQuery(
      'INSERT INTO notifications (type, title, message, description, for_admin, for_dealer, for_user, for_vendor, product_id, dealer_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [notificationData.type, notificationData.title, notificationData.message, notificationData.description, notificationData.for_admin, notificationData.for_dealer, notificationData.for_user, notificationData.for_vendor, notificationData.product_id, params.dealerId, notificationData.metadata, indiaTime]
    );
    
    console.log('Notification stored in database:', result);
    
    console.log('Notification stored in database successfully');
    
  } catch (error) {
    console.error('Failed to send product creation notification:', error);
    throw error;
  }
}