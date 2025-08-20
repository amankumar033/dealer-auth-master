'use client';

import { useState, useEffect, useRef } from 'react';
import { Product, Category, SubCategory, Brand, SubBrand, CreateProductRequest, UpdateProductRequest } from '@/types/database';
import { categoryApi, subCategoryApi, brandApi, subBrandApi } from '@/lib/api';
import { roundRating, validatePricing } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { FiUpload, FiX, FiImage, FiArrowLeft } from 'react-icons/fi';
import LoadingButton from '../ui/LoadingButton';
import CustomDropdown from '../ui/CustomDropdown';

// Dynamic import for JoditEditor to avoid SSR issues
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => <div className="w-full h-32 bg-gray-100 animate-pulse rounded"></div>
});

interface ProductFormProps {
  product?: Product;
  dealerId: string;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProductForm({ product, dealerId, onSubmit, onCancel, isLoading = false }: ProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [subBrands, setSubBrands] = useState<SubBrand[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showSubBrandDropdown, setShowSubBrandDropdown] = useState(false);
  const [showManufacturerDropdown, setShowManufacturerDropdown] = useState(false);
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [isCreatingSubBrand, setIsCreatingSubBrand] = useState(false);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0); // Track which image is primary

  // Manufacturer options
  const manufacturerOptions = [
    'Mahindra',
    'Toyota',
    'BMW',
    'Jaguar',
    'Nissan',
    'Peugeot',
    'Ford Mustang',
    'Porsche',
    'Audi',
    'TVS',
    'Robert Bosch GmbH',
    'Denso',
    'Magna International',
    'Continental AG'
  ];
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    manufacture: product?.manufacture || '',
    stock_quantity: product?.stock_quantity || 0,
    is_active: product?.is_active ?? true,
  });

  // Filter manufacturer options based on input
  const filteredManufacturers = manufacturerOptions.filter(option =>
    option.toLowerCase().includes(formData.manufacture?.toLowerCase() || '')
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('ProductForm: Loading all categories');
        const categoriesData = await categoryApi.getAllCategories();
        console.log('ProductForm: Loaded categories:', categoriesData);
        
        // Ensure we have valid data structure
        const validCategories = Array.isArray(categoriesData) 
          ? categoriesData.filter(category => category && category.category_id && category.name)
          : [];
        setCategories(validCategories);

        console.log('ProductForm: Loading all brands');
        const brandsData = await brandApi.getAll();
        console.log('ProductForm: Loaded brands:', brandsData);
        
        // Ensure we have valid data structure
        const validBrands = Array.isArray(brandsData) 
          ? brandsData.filter(brand => brand && brand.brand_name)
          : [];
        setBrands(validBrands);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();

    // Load sub-categories if product has a category
    if (product?.category_id) {
      loadSubCategories(product.category_id);
    }

    // Load sub-brands if product has a brand
    if (product?.brand_name) {
      loadSubBrands(product.brand_name);
    }

    // Initialize image preview from existing product
    if (product?.images && Array.isArray(product.images)) {
      // Product has multiple images
      setImagePreviews(product.images);
      // Find which image is currently the primary image (image_1)
      if (product.image_1) {
        const image1String = typeof product.image_1 === 'string' ? product.image_1 : product.image_1.toString('base64');
        console.log('🔍 Looking for primary image in', product.images.length, 'images');
        
        // Simple comparison: find the image that matches image_1
        const primaryIndex = product.images.findIndex(img => {
          // Compare the first 100 characters to avoid exact string comparison issues
          const imgStart = img.substring(0, 100);
          const image1Start = image1String.substring(0, 100);
          return imgStart === image1Start;
        });
        
        console.log('🔍 Primary image index found:', primaryIndex);
        
        if (primaryIndex !== -1) {
          setPrimaryImageIndex(primaryIndex);
          console.log('🔍 Set primary image index to:', primaryIndex);
        } else {
          console.log('🔍 No primary image found, defaulting to 0');
          setPrimaryImageIndex(0);
        }
      }
    } else if (product?.image_1) {
      // Product has single image
      if (typeof product.image_1 === 'string' && (product.image_1.startsWith('blob:') || product.image_1.startsWith('data:'))) {
        setImagePreviews([product.image_1]);
        // Single image is always primary
        setPrimaryImageIndex(0);
        console.log('🔍 Single image product, setting primary index to 0');
      }
    }
  }, [product]);

  // Function to load sub-categories for a selected category
  const loadSubCategories = async (categoryId: string) => {
    try {
      console.log('ProductForm: Loading sub-categories for category:', categoryId);
      const subCategoriesData = await subCategoryApi.getByCategory(categoryId);
      console.log('ProductForm: Loaded sub-categories:', subCategoriesData);
      
      // Ensure we have valid data structure
      const validSubCategories = Array.isArray(subCategoriesData) 
        ? subCategoriesData.filter(subCategory => subCategory && subCategory.sub_category_id && subCategory.name)
        : [];
      
      setSubCategories(validSubCategories);
    } catch (error) {
      console.error('Failed to load sub-categories:', error);
      setSubCategories([]);
    }
  };

  // Function to load sub-brands for a selected brand
  const loadSubBrands = async (brandName: string) => {
    try {
      console.log('ProductForm: Loading sub-brands for brand:', brandName);
      const subBrandsData = await subBrandApi.getAll(brandName);
      console.log('ProductForm: Loaded sub-brands:', subBrandsData);
      
      // Ensure we have valid data structure
      const validSubBrands = Array.isArray(subBrandsData) 
        ? subBrandsData.filter(subBrand => subBrand && subBrand.sub_brand_name)
        : [];
      
      setSubBrands(validSubBrands);
    } catch (error) {
      console.error('Failed to load sub-brands:', error);
      setSubBrands([]);
    }
  };

  // Function to create a new brand
  const createBrand = async (brandName: string) => {
    try {
      setIsCreatingBrand(true);
      const newBrand = await brandApi.create(brandName);
      setBrands(prev => [...prev, newBrand]);
      setFormData(prev => ({ ...prev, brand_name: brandName }));
      setShowBrandDropdown(false);
      console.log('Brand created successfully:', newBrand);
    } catch (error: any) {
      console.error('Failed to create brand:', error);
      
      // Check if it's a 409 conflict (brand already exists)
      if (error.message && error.message.includes('409')) {
        // Brand already exists, just select it
        setFormData(prev => ({ ...prev, brand_name: brandName }));
        setShowBrandDropdown(false);
        console.log('Brand already exists, selected:', brandName);
      } else {
        // Show the specific error message
        const errorMessage = error.message || 'Failed to create brand. Please try again.';
        alert(errorMessage);
      }
    } finally {
      setIsCreatingBrand(false);
    }
  };

  // Function to create a new sub-brand
  const createSubBrand = async (subBrandName: string, brandName: string) => {
    try {
      setIsCreatingSubBrand(true);
      const newSubBrand = await subBrandApi.create(subBrandName, brandName);
      setSubBrands(prev => [...prev, newSubBrand]);
      setFormData(prev => ({ ...prev, sub_brand_name: subBrandName }));
      setShowSubBrandDropdown(false);
      console.log('Sub-brand created successfully:', newSubBrand);
    } catch (error: any) {
      console.error('Failed to create sub-brand:', error);
      
      // Check if it's a 409 conflict (sub-brand already exists)
      if (error.message && error.message.includes('409')) {
        // Sub-brand already exists, just select it
        setFormData(prev => ({ ...prev, sub_brand_name: subBrandName }));
        setShowSubBrandDropdown(false);
        console.log('Sub-brand already exists, selected:', subBrandName);
      } else {
        // Show the specific error message
        const errorMessage = error.message || 'Failed to create sub-brand. Please try again.';
        alert(errorMessage);
      }
    } finally {
      setIsCreatingSubBrand(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.brand-dropdown-container')) {
        setShowBrandDropdown(false);
      }
      if (!target.closest('.sub-brand-dropdown-container')) {
        setShowSubBrandDropdown(false);
      }
      if (!target.closest('.manufacturer-dropdown-container')) {
        setShowManufacturerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  const submitForm = () => {
    // Validate that category_id is selected
    if (!formData.category_id) {
      alert('Please select a category');
      return;
    }

    // Validate sale price vs original price
    if (!validatePricing(formData.sale_price, formData.original_price)) {
      alert('Sale price must be less than original price');
      return;
    }

    // Validate that at least one image is selected
    if (selectedImages.length === 0 && imagePreviews.length === 0) {
      alert('Please upload at least one product image');
      return;
    }

    // Round the rating
    const roundedRating = roundRating(formData.rating);
    
    // Convert images to base64
    const processImages = async () => {
      const processedImages: string[] = [];
      
      // Process new selected images first
      for (const image of selectedImages) {
        const reader = new FileReader();
        const result = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(image);
        });
        processedImages.push(result);
      }
      
      // Add existing image previews (these are the images that weren't removed)
      processedImages.push(...imagePreviews);
      
      // Simple logic: Get the image at primaryImageIndex from the UI order
      const allImages = [...selectedImages, ...imagePreviews];
      let primaryImage = '';
      
      console.log('🔍 Primary image selection:', {
        primaryImageIndex,
        selectedImagesLength: selectedImages.length,
        imagePreviewsLength: imagePreviews.length,
        totalImages: allImages.length
      });
      
      if (primaryImageIndex < allImages.length) {
        if (primaryImageIndex < selectedImages.length) {
          // Primary image is a new selected image
          const reader = new FileReader();
          primaryImage = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(selectedImages[primaryImageIndex]);
          });
        } else {
          // Primary image is from existing imagePreviews
          const existingIndex = primaryImageIndex - selectedImages.length;
          primaryImage = imagePreviews[existingIndex] || '';
        }
      }
      
      console.log('🔍 Selected primary image length:', primaryImage.length);
      
      const submitData = {
        ...formData,
        rating: roundedRating,
        category_id: formData.category_id,
        dealer_id: dealerId,
        images: processedImages, // Send as array of images
        image_1: primaryImage || processedImages[0] || '', // Use selected primary image
      };
      
      console.log('🔍 Form submission data:', {
        primaryImageIndex,
        primaryImageLength: primaryImage.length,
        totalImages: processedImages.length,
        image1Length: submitData.image_1.length,
        manufacture: submitData.manufacture
      });
      
      onSubmit(submitData);
    };
    
    processImages();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
    
    // If category changes, load sub-categories and reset sub_category_id
    if (name === 'category_id') {
      if (value) {
        loadSubCategories(value);
      } else {
        setSubCategories([]);
      }
      setFormData(prev => ({ ...prev, sub_category_id: '' }));
    }

    // If brand changes, load sub-brands and reset sub_brand_name
    if (name === 'brand_name') {
      if (value) {
        loadSubBrands(value);
      } else {
        setSubBrands([]);
      }
      setFormData(prev => ({ ...prev, sub_brand_name: '' }));
    }
  };

  const handleBrandSelect = (brandName: string) => {
    setFormData(prev => ({ ...prev, brand_name: brandName }));
    setShowBrandDropdown(false);
    // Load sub-brands for the selected brand
    loadSubBrands(brandName);
  };

  const handleSubBrandSelect = (subBrandName: string) => {
    setFormData(prev => ({ ...prev, sub_brand_name: subBrandName }));
    setShowSubBrandDropdown(false);
  };

  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === '0') {
      setFormData(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        [name]: 0
      }));
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image file`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image file ${file.name} must be less than 5MB`);
        continue;
      }

      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    // Add new files to existing ones
    setSelectedImages(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    e.target.value = ''; // Reset input
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    // Check if the index is within selectedImages (new files)
    if (index < selectedImages.length) {
      // Remove from selectedImages (new files)
      setSelectedImages(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove from imagePreviews (existing images)
      const existingImageIndex = index - selectedImages.length;
      setImagePreviews(prev => prev.filter((_, i) => i !== existingImageIndex));
    }
    
    // Adjust primary image index if needed
    if (primaryImageIndex === index) {
      // If we're removing the primary image, set the first remaining image as primary
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      // If we're removing an image before the primary, adjust the index
      setPrimaryImageIndex(prev => Math.max(0, prev - 1));
    }
  };

  const removeAllImages = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    setPrimaryImageIndex(0); // Reset primary image index
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Filter brands based on input
  const filteredBrands = brands.filter(brand =>
    brand && brand.brand_name && 
    brand.brand_name.toLowerCase().includes(formData.brand_name.toLowerCase())
  );

  // Filter sub-brands based on input
  const filteredSubBrands = subBrands.filter(subBrand =>
    subBrand && subBrand.sub_brand_name && 
    subBrand.sub_brand_name.toLowerCase().includes(formData.sub_brand_name.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col form-transition">
      {/* Header - Sticky */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10 form-fade-enter">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                type="button"
                onClick={onCancel}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <FiArrowLeft className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {product ? 'Edit Product' : 'Add New Product'}
              </h1>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-900"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {product ? 'Update product information and settings' : 'Create a new product for your store'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-0 sm:px-6 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 form-scale-enter">
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
              {/* Basic Information Section */}
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="relative brand-dropdown-container">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          name="brand_name"
                          value={formData.brand_name}
                          onChange={handleChange}
                          onFocus={() => setShowBrandDropdown(true)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                          placeholder="Enter brand name or select from dropdown"
                        />
                        
                        {showBrandDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 h-50 overflow-y-auto">
                            {filteredBrands.length > 0 ? (
                              filteredBrands.map((brand) => (
                                <button
                                  key={brand.brand_name}
                                  type="button"
                                  onClick={() => handleBrandSelect(brand.brand_name)}
                                  className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm"
                                >
                                  {brand.brand_name}
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No matching brands found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => createBrand(formData.brand_name)}
                        disabled={!formData.brand_name || isCreatingBrand}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isCreatingBrand ? 'Creating...' : 'Add'}
                      </button>
                    </div>
                  </div>

                  <div className="relative sub-brand-dropdown-container">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sub-Brand
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          name="sub_brand_name"
                          value={formData.sub_brand_name}
                          onChange={handleChange}
                          onFocus={() => setShowSubBrandDropdown(true)}
                          disabled={!formData.brand_name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100"
                          placeholder={formData.brand_name ? "Enter sub-brand name or select from dropdown" : "Select a brand first"}
                        />
                        
                        {showSubBrandDropdown && formData.brand_name && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 h-50 overflow-y-auto">
                            {filteredSubBrands.length > 0 ? (
                              filteredSubBrands.map((subBrand) => (
                                <button
                                  key={subBrand.sub_brand_name}
                                  type="button"
                                  onClick={() => handleSubBrandSelect(subBrand.sub_brand_name)}
                                  className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm"
                                >
                                  {subBrand.sub_brand_name}
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No matching sub-brands found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => createSubBrand(formData.sub_brand_name, formData.brand_name)}
                        disabled={!formData.sub_brand_name || !formData.brand_name || isCreatingSubBrand}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isCreatingSubBrand ? 'Creating...' : 'Add'}
                      </button>
                    </div>
                  </div>

                  <CustomDropdown
                    options={[
                      { value: '', label: 'Select manufacturer or enter custom name', disabled: true },
                      ...manufacturerOptions.map(manufacturer => ({
                        value: manufacturer,
                        label: manufacturer
                      }))
                    ]}
                    value={formData.manufacture}
                    onChange={(value) => setFormData(prev => ({ ...prev, manufacture: value }))}
                    placeholder="Select manufacturer or enter custom name"
                    label="Manufacturer"
                    searchable
                    maxHeight="h-50"
                  />

                  <CustomDropdown
                    options={[
                      { value: '', label: 'Select a category', disabled: true },
                      ...categories.map(category => ({
                        value: category.category_id,
                        label: category.name
                      }))
                    ]}
                    value={formData.category_id}
                    onChange={(value) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        category_id: value,
                        sub_category_id: '' // Reset sub-category when category changes
                      }));
                      if (value) {
                        loadSubCategories(value);
                      } else {
                        setSubCategories([]);
                      }
                    }}
                    placeholder="Select a category"
                    label="Category"
                    required
                    searchable
                    maxHeight="h-50"
                  />

                  <CustomDropdown
                    options={[
                      { value: '', label: formData.category_id ? "Select a sub-category (optional)" : "Select a category first", disabled: !formData.category_id },
                      ...subCategories.map(subCategory => ({
                        value: subCategory.sub_category_id,
                        label: subCategory.name
                      }))
                    ]}
                    value={formData.sub_category_id}
                    onChange={(value) => setFormData(prev => ({ ...prev, sub_category_id: value }))}
                    placeholder={formData.category_id ? "Select a sub-category (optional)" : "Select a category first"}
                    label="Sub-Category"
                    disabled={!formData.category_id}
                    searchable
                    maxHeight="h-50"
                  />

                  {product && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating (Read-only)
                      </label>
                      <input
                        type="number"
                        name="rating"
                        value={formData.rating}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                        placeholder="0.0"
                      />
                      <p className="text-gray-500 text-xs mt-1">
                        Rating is managed by customer reviews
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-300">
                    <JoditEditor
                    value={formData.description}
                      config={{
                        readonly: false,
                        placeholder: 'Enter product description',
                        height: 300,
                        theme: 'default',
                        toolbar: true,
                        spellcheck: false,
                        language: 'en',

                        imageDefaultWidth: 300,
                        removeButtons: ['source', 'about', 'fullsize', 'preview'],
                        showCharsCounter: true,
                        showWordsCounter: true,
                        showXPathInStatusbar: false,
                        askBeforePasteHTML: false,
                        askBeforePasteFromWord: false,
                        enter: 'p' as const,
                        defaultMode: 1,
                        useSearch: true,
                        showPlaceholder: true,
                        buttons: [
                          'bold', 'strikethrough', 'underline', 'italic', '|',
                          'ul', 'ol', '|',
                          'outdent', 'indent', '|',
                          'font', 'fontsize', 'brush', 'paragraph', '|',
                          'image', 'link', '|',
                          'align', 'undo', 'redo', '|',
                          'hr', 'eraser', 'copyformat', '|',
                          'table', 'selectall', 'cut', 'copy', 'paste'
                        ],
                        controls: {
                          fontsize: {
                            list: [
                              '8',
                              '10',
                              '12',
                              '14',
                              '16',
                              '18',
                              '20',
                              '22',
                              '24',
                              '26',
                              '28',
                              '30',
                              '32',
                              '34',
                              '36',
                              '48',
                              '72'
                            ]
                          },
                          paragraph: {
                            list: {
                              'p': 'Paragraph',
                              'h1': 'Heading 1',
                              'h2': 'Heading 2',
                              'h3': 'Heading 3',
                              'h4': 'Heading 4',
                              'h5': 'Heading 5',
                              'h6': 'Heading 6',
                              'blockquote': 'Quote',
                              'pre': 'Code'
                            }
                          },
                          ul: {
                            list: {
                              'disc': 'Disc',
                              'circle': 'Circle',
                              'square': 'Square'
                            }
                          },
                          ol: {
                            list: {
                              'decimal': 'Decimal',
                              'lower-alpha': 'Lower Alpha',
                              'upper-alpha': 'Upper Alpha',
                              'lower-roman': 'Lower Roman',
                              'upper-roman': 'Upper Roman'
                            }
                          }
                        },
                        style: {
                          color: '#000000',
                          fontSize: '14px',
                          fontFamily: 'Arial, Helvetica, sans-serif'
                        },
                        colorPickerDefaultTab: 'color' as const,
                        events: {
                          afterInit: function(editor: any) {
                            // Enable spell check
                            editor.events.on('keydown', function(event: any) {
                              // Handle Enter key for list continuation
                              if (event.key === 'Enter') {
                                const selection = editor.selection;
                                const currentElement = selection.current();
                                
                                if (currentElement) {
                                  const parentElement = currentElement.parentElement;
                                  if (parentElement && (parentElement.tagName === 'LI' || parentElement.tagName === 'UL' || parentElement.tagName === 'OL')) {
                                    // Continue list on new line
                                    setTimeout(() => {
                                      editor.execCommand('insertHTML', '<br>');
                                    }, 10);
                                  }
                                }
                              }
                            });
                          }
                        }
                      }}
                      tabIndex={1}
                      onBlur={(newContent: string) => setFormData(prev => ({ ...prev, description: newContent }))}
                      onChange={(newContent: string) => {}}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description *
                  </label>
                  <textarea
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Enter a brief summary of the product"
                  />
                </div>
              </div>

              {/* Pricing and Stock Section */}
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">₹</span>
                      <input
                        type="number"
                        name="original_price"
                        value={formData.original_price}
                        onChange={handleChange}
                        onFocus={handleNumberFocus}
                        onBlur={handleNumberBlur}
                        required
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sale Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">₹</span>
                      <input
                        type="number"
                        name="sale_price"
                        value={formData.sale_price}
                        onChange={handleChange}
                        onFocus={handleNumberFocus}
                        onBlur={handleNumberBlur}
                        required
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        placeholder="0.00"
                      />
                    </div>
                    {!validatePricing(formData.sale_price, formData.original_price) && formData.sale_price > 0 && (
                      <p className="text-red-500 text-xs mt-1">Sale price must be less than original price</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      name="stock_quantity"
                      value={formData.stock_quantity}
                      onChange={handleChange}
                      onFocus={handleNumberFocus}
                      onBlur={handleNumberBlur}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Media Section */}
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images *</h2>
                
                {/* Image Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <FiImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-sm text-gray-600 mb-4">
                    <p className="font-medium">Upload product images</p>
                    <p>Drag and drop images here, or click to browse (multiple images supported)</p>
                  </div>
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <FiUpload className="mr-2 h-4 w-4" />
                    Choose File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>

                {/* Image Previews */}
                {(imagePreviews.length > 0 || selectedImages.length > 0) && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">
                          Selected Images ({imagePreviews.length})
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Click the &quot;Primary&quot; checkbox to set the main product image
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeAllImages}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <div className={`w-32 h-32 bg-gray-100 rounded-lg overflow-hidden ${primaryImageIndex === index ? 'ring-2 ring-blue-500' : ''}`}>
                            <img
                              src={preview}
                              alt={`Product preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Primary Image Badge */}
                          {primaryImageIndex === index && (
                            <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              Primary
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <FiX className="h-4 w-4" />
                          </button>
                          {/* Primary Image Checkbox */}
                          <div className="absolute -bottom-2 -left-2">
                            <label className="flex items-center bg-white rounded-full px-2 py-1 shadow-md cursor-pointer">
                              <input
                                type="checkbox"
                                checked={primaryImageIndex === index}
                                onChange={() => {
                                  console.log('🔍 Primary image checkbox clicked:', {
                                    index,
                                    currentPrimary: primaryImageIndex,
                                    newPrimary: index
                                  });
                                  setPrimaryImageIndex(index);
                                }}
                                className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-1 text-xs text-gray-700 font-medium">Primary</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Settings Section */}
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-3 block text-sm text-gray-700">
                    Active - Make this product Available to customers
                  </label>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              Cancel
            </button>
            <LoadingButton
              type="submit"
              onClick={submitForm}
              loading={isLoading}
              disabled={!validatePricing(formData.sale_price, formData.original_price) || (selectedImages.length === 0 && imagePreviews.length === 0)}
              variant="primary"
              size="lg"
              className="flex-1"
              loadingText="Saving..."
            >
              {product ? 'Update Product' : 'Create Product'}
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
} 