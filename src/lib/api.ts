import { Category, SubCategory, Product, Brand, SubBrand, CreateCategoryRequest, UpdateCategoryRequest, CreateProductRequest, UpdateProductRequest } from '@/types/database';

const API_BASE = '/api';

// Category API functions
export const categoryApi = {
  async getAll(dealerId: string): Promise<Category[]> {
    try {
      const response = await fetch(`${API_BASE}/categories?dealer_id=${dealerId}`);
      if (!response.ok) {
        console.error('Failed to fetch categories:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${API_BASE}/categories?show_all=true`);
      if (!response.ok) {
        console.error('Failed to fetch all categories:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching all categories:', error);
      return [];
    }
  },

  async getByDealer(dealerId: string): Promise<Category[]> {
    try {
      const response = await fetch(`${API_BASE}/categories?dealer_id=${dealerId}`);
      if (!response.ok) {
        console.error('Failed to fetch categories by dealer:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching categories by dealer:', error);
      return [];
    }
  },

  async getById(id: string, dealerId: string): Promise<Category> {
    try {
      const response = await fetch(`${API_BASE}/categories/${id}?dealer_id=${dealerId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch category: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      throw error;
    }
  },

  async create(category: CreateCategoryRequest): Promise<Category> {
    try {
      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      if (!response.ok) {
        throw new Error(`Failed to create category: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  async update(id: string, category: UpdateCategoryRequest, dealerId: string): Promise<Category> {
    try {
      const response = await fetch(`${API_BASE}/categories/${id}?dealer_id=${dealerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      if (!response.ok) {
        throw new Error(`Failed to update category: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  async disassociate(id: string, dealerId: string): Promise<void> {
    try {
      console.log('🔍 Debug: categoryApi.disassociate called');
      console.log('  - id:', id);
      console.log('  - dealerId:', dealerId);
      
      const requestBody = {
        dealer_id: null,
        id: 1
      };
      console.log('  - requestBody:', requestBody);
      
      const response = await fetch(`${API_BASE}/categories/${id}?dealer_id=${dealerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      console.log('  - response.status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('  - error response:', errorText);
        throw new Error(`Failed to disassociate category: ${response.status} - ${errorText}`);
      }
      
      console.log('  - disassociation successful');
    } catch (error) {
      console.error('Error disassociating category:', error);
      throw error;
    }
  },

  async delete(id: string, dealerId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/categories/${id}?dealer_id=${dealerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to delete category: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },
};

// Product API functions
export const productApi = {
  async getAll(dealerId?: string, categoryId?: string, page: number = 1, limit: number = 20, includeImages: boolean = true): Promise<{ products: Product[], pagination: any }> {
    try {
      const params = new URLSearchParams();
      if (dealerId) params.append('dealer_id', dealerId);
      if (categoryId) params.append('category_id', categoryId);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (!includeImages) params.append('include_images', 'false');
      
      const response = await fetch(`${API_BASE}/products?${params}`);
      if (!response.ok) {
        console.error('Failed to fetch products:', response.status, response.statusText);
        return { products: [], pagination: {} };
      }
      const data = await response.json();
      
      // Handle both old format (array) and new format (object with products and pagination)
      if (Array.isArray(data)) {
        return { products: data, pagination: {} };
      } else {
        return { products: data.products || [], pagination: data.pagination || {} };
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      return { products: [], pagination: {} };
    }
  },

  async getByCategoryForDealer(categoryId: string, dealerId: string): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE}/products?category_id=${categoryId}&dealer_id=${dealerId}`);
      if (!response.ok) {
        console.error('Failed to fetch products by category:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      return [];
    }
  },

  async getByCategory(categoryId: string): Promise<Product[]> {
    try {
      const response = await fetch(`${API_BASE}/products?category_id=${categoryId}&show_all=true`);
      if (!response.ok) {
        console.error('Failed to fetch all products by category:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching all products by category:', error);
      return [];
    }
  },

  async getById(id: string, dealerId: string): Promise<Product> {
    try {
      const response = await fetch(`${API_BASE}/products/${id}?dealer_id=${dealerId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  },

  async create(product: CreateProductRequest): Promise<Product> {
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) {
        throw new Error(`Failed to create product: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  async update(id: string, product: UpdateProductRequest): Promise<Product> {
    try {
      const response = await fetch(`${API_BASE}/products/${id}?dealer_id=${product.dealer_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async delete(id: string, dealerId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/products/${id}?dealer_id=${dealerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
};

// Sub-Category API functions
export const subCategoryApi = {
  async getByCategory(categoryId: string): Promise<SubCategory[]> {
    try {
      const response = await fetch(`${API_BASE}/sub-categories?category_id=${categoryId}`);
      if (!response.ok) {
        console.error('Failed to fetch sub-categories:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching sub-categories:', error);
      return [];
    }
  },

  async getAll(): Promise<SubCategory[]> {
    try {
      const response = await fetch(`${API_BASE}/sub-categories`);
      if (!response.ok) {
        console.error('Failed to fetch all sub-categories:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching all sub-categories:', error);
      return [];
    }
  },

  async create(data: { name: string; category_id?: string }): Promise<SubCategory> {
    try {
      const response = await fetch(`${API_BASE}/sub-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Failed to create sub-category: ${response.status}`);
      }
      const result = await response.json();
      return result.subCategory;
    } catch (error) {
      console.error('Error creating sub-category:', error);
      throw error;
    }
  }
};

// Brand API functions
export const brandApi = {
  async getAll(): Promise<Brand[]> {
    try {
      const response = await fetch(`${API_BASE}/brands`);
      if (!response.ok) {
        console.error('Failed to fetch brands:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching brands:', error);
      return [];
    }
  },

  async create(brandName: string): Promise<Brand> {
    try {
      const response = await fetch(`${API_BASE}/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_name: brandName }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          // Brand already exists, return the existing brand
          const existingBrands = await this.getAll();
          const existingBrand = existingBrands.find(brand => brand.brand_name === brandName);
          if (existingBrand) {
            return existingBrand;
          }
        }
        
        // Get the error message from the response
        let errorMessage = `Failed to create brand: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error response, use the status
          if (response.status === 400) {
            errorMessage = 'Invalid data provided. Please check that brand name is provided.';
          }
        }
        
        throw new Error(errorMessage);
      }
      const result = await response.json();
      // The API returns { success: true, id: brand_name }
      // We need to create a brand object with the brand_name
      return { 
        brand_name: brandName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating brand:', error);
      throw error;
    }
  }
};

// Sub-Brand API functions
export const subBrandApi = {
  async getAll(brandName?: string): Promise<SubBrand[]> {
    try {
      const url = brandName 
        ? `${API_BASE}/sub-brands?brand_name=${encodeURIComponent(brandName)}`
        : `${API_BASE}/sub-brands`;
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Failed to fetch sub-brands:', response.status, response.statusText);
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching sub-brands:', error);
      return [];
    }
  },

  async create(subBrandName: string, brandName: string): Promise<SubBrand> {
    try {
      const response = await fetch(`${API_BASE}/sub-brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sub_brand_name: subBrandName,
          brand_name: brandName 
        }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          // Sub-brand already exists, return the existing sub-brand
          const existingSubBrands = await this.getAll(brandName);
          const existingSubBrand = existingSubBrands.find(subBrand => subBrand.sub_brand_name === subBrandName);
          if (existingSubBrand) {
            return existingSubBrand;
          }
        }
        
        // Get the error message from the response
        let errorMessage = `Failed to create sub-brand: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error response, use the status
          if (response.status === 400) {
            errorMessage = 'Invalid data provided. Please check that both sub-brand name and brand name are provided and the brand exists.';
          }
        }
        
        throw new Error(errorMessage);
      }
      const result = await response.json();
      // The API returns { success: true, id: sub_brand_name }
      // We need to create a sub-brand object with the sub_brand_name and brand_name
      return { 
        sub_brand_name: subBrandName, 
        brand_name: brandName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating sub-brand:', error);
      throw error;
    }
  }
};