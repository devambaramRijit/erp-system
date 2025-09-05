import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Product {
  id: string;
  sku: string;
  name: string;
  productType: string;
  productType2: string;
  productCategory: string;
  quantity: number;
  costPricePerPiece: number;
  ratePerPiece: number;
  costPricePerInch?: number;
  ratePerInch?: number;
}

const AdvancedInventoryTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>(['Electronics', 'Furniture', 'Office Supplies', 'Laddu Gopal Dress', 'Laddu Gopal Base']);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    sku: '',
    name: '',
    productType: 'Traded',
    productType2: 'Standard',
    productCategory: '',
    quantity: 0,
    costPricePerPiece: 0,
    ratePerPiece: 0,
    costPricePerInch: undefined,
    ratePerInch: undefined
  });

  // Load categories from localStorage on component mount
  useEffect(() => {
    console.log('[COMPONENT LIFECYCLE] AdvancedInventoryTab component mounted');
    
    // Check if we have categories in localStorage
    const savedCategories = localStorage.getItem('inventoryCategories');
    if (savedCategories) {
      const categoriesData = JSON.parse(savedCategories);
      console.log('[COMPONENT INIT] Loaded categories from localStorage:', categoriesData);
      setCategories(categoriesData);
    } else {
      console.log('[COMPONENT INIT] No categories found in localStorage, using defaults');
    }

    // First try to load products from localStorage
    const savedProducts = localStorage.getItem('inventoryProducts');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        console.log('[COMPONENT INIT] Loaded products from localStorage:', parsedProducts);
        
        // Check if we have product types in localStorage
        const savedProductTypes = localStorage.getItem('inventoryProductTypes');
        let productTypesMap = new Map();
        
        if (savedProductTypes) {
          try {
            const parsedTypes = JSON.parse(savedProductTypes);
            
            // Check if parsedTypes is an array of entries (key-value pairs)
            if (Array.isArray(parsedTypes) && parsedTypes.length > 0) {
              // Validate each entry is an array with exactly 2 elements
              const isValidFormat = parsedTypes.every(entry => 
                Array.isArray(entry) && entry.length === 2
              );
              
              if (isValidFormat) {
                productTypesMap = new Map(parsedTypes);
                console.log('[COMPONENT INIT] Loaded product types from localStorage:', productTypesMap);
              } else {
                // If it's not in the right format, clear the invalid data and create a new empty map
                console.warn('[COMPONENT INIT] Product types data is not in expected format, clearing invalid data');
                localStorage.removeItem('inventoryProductTypes');
                productTypesMap = new Map();
              }
            } else {
              // If it's not an array, clear the invalid data and create a new empty map
              console.warn('[COMPONENT INIT] Product types data is not an array, clearing invalid data');
              localStorage.removeItem('inventoryProductTypes');
              productTypesMap = new Map();
            }
            
            // Apply saved product types to loaded products
            const productsWithTypes = parsedProducts.map((product: Product) => {
              if (productTypesMap.has(product.id)) {
                console.log(`[COMPONENT INIT] Applying saved product type ${productTypesMap.get(product.id)} to product ${product.id}`);
                return { ...product, productType: productTypesMap.get(product.id) };
              }
              return product;
            });
            
            setProducts(productsWithTypes);
          } catch (err) {
            console.error('[COMPONENT INIT] Error parsing product types from localStorage:', err);
            // Clear the invalid data
            localStorage.removeItem('inventoryProductTypes');
            setProducts(parsedProducts);
          }
        } else {
          setProducts(parsedProducts);
        }
        
        setLoading(false);
        
        // Still fetch from API to sync, but don't overwrite localStorage product types
        fetchProductsWithSync();
      } catch (err) {
        console.error('[COMPONENT INIT] Error parsing localStorage products:', err);
        fetchProducts();
      }
    } else {
      console.log('[COMPONENT INIT] No products found in localStorage, fetching from API');
      fetchProducts();
    }
  }, []);

  // Save categories to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('inventoryCategories', JSON.stringify(categories));
    console.log('[DATA PERSISTENCE] Saved categories to localStorage');
  }, [categories]);
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await axios.get('/api/auth/check-admin');
        setIsAdmin(response.data.isAdmin);
        console.log('[ADMIN] Admin status checked:', response.data.isAdmin);
      } catch (err) {
        console.error('[ADMIN] Error checking admin status:', err);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  // Function to sync product types with server
  const syncProductTypesToServer = async () => {
    if (!isAdmin) {
      console.log('[SYNC] User is not admin, skipping sync');
      return;
    }
    
    setSyncStatus('syncing');
    
    try {
      // Get product types from localStorage
      const savedProductTypes = localStorage.getItem('inventoryProductTypes');
      
      if (savedProductTypes) {
        const parsedTypes = JSON.parse(savedProductTypes);
        
        // Send to server
        const response = await axios.post('/api/inventory/sync-product-types', {
          productTypes: parsedTypes
        });
        
        console.log('[SYNC] Successfully synced product types to server:', response.data);
        setSyncStatus('success');
        
        // Reset status after delay
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        console.log('[SYNC] No product types to sync');
        setSyncStatus('idle');
      }
    } catch (err) {
      console.error('[SYNC] Error syncing product types to server:', err);
      setSyncStatus('error');
      
      // Reset status after delay
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };
  
  // Function to fetch product types from server
  const fetchProductTypesFromServer = async () => {
    if (!isAdmin) {
      console.log('[FETCH] User is not admin, skipping fetch');
      return;
    }
    
    try {
      const response = await axios.get('/api/inventory/product-types');
      
      if (response.data && response.data.productTypes) {
        const serverProductTypes = response.data.productTypes;
        
        // Save to localStorage
        localStorage.setItem('inventoryProductTypes', JSON.stringify(serverProductTypes));
        console.log('[FETCH] Successfully fetched product types from server:', serverProductTypes);
        
        // Apply to current products
        const productTypesMap = new Map(serverProductTypes);
        const updatedProducts = products.map(product => {
          if (productTypesMap.has(product.id)) {
            console.log(`[FETCH] Applying server product type ${productTypesMap.get(product.id)} to product ${product.id}`);
            return { ...product, productType: productTypesMap.get(product.id) };
          }
          return product;
        });
        
        setProducts(updatedProducts);
        alert('Successfully loaded product types from server!');
      } else {
        console.log('[FETCH] No product types found on server');
      }
    } catch (err) {
      console.error('[FETCH] Error fetching product types from server:', err);
      alert('Failed to fetch product types from server');
    }
  };

  // Filter products based on search term
  useEffect(() => {
    let result = products;

    if (searchTerm) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCategory.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(result);
  }, [searchTerm, products]);

  // Fetch products from API but preserve product types from localStorage
  const fetchProductsWithSync = async () => {
    try {
      console.log('[DATA SYNC] Attempting to sync products from API');
      
      const response = await axios.get('/api/inventory');
      
      // Get current products from state
      const currentProducts = [...products];
      
      // Create a map of current products by ID for quick lookup
      const currentProductsMap = new Map();
      currentProducts.forEach(product => {
        currentProductsMap.set(product.id, product);
      });
      
      // Transform API data but preserve product types from localStorage
      const syncedProducts = response.data.map((item: any) => {
        const currentProduct = currentProductsMap.get(item.id);
        
        // Preserve product type if it exists in localStorage
        const preservedProductType = currentProduct ? currentProduct.productType : (item.productType || 'Traded');
        
        console.log(`[DATA SYNC] Syncing product ${item.id}, preserving productType: ${preservedProductType}`);
        
        return {
          id: item.id,
          sku: item.sku,
          name: item.name,
          productType: preservedProductType,
          productType2: item.productType2 || (preservedProductType === 'Manufactured' ? 'Custom' : 'Standard'),
          productCategory: item.category || 'General',
          quantity: item.quantity,
          costPricePerPiece: item.costPricePerPiece || item.price || 0,
          ratePerPiece: item.ratePerPiece || (item.price * 1.2) || 0,
          costPricePerInch: item.costPricePerInch,
          ratePerInch: item.ratePerInch
        };
      });
      
      // Update state with synced products
      setProducts(syncedProducts);
      
      // Save to localStorage
      localStorage.setItem('inventoryProducts', JSON.stringify(syncedProducts));
      console.log('[DATA SYNC] Saved synced products to localStorage');
      
      // Create and save product types map
      const productTypesMap = new Map();
      syncedProducts.forEach(product => {
        productTypesMap.set(product.id, product.productType);
      });
      
      // Convert Map to array of entries and save to localStorage
      const productTypesArray = Array.from(productTypesMap.entries());
      localStorage.setItem('inventoryProductTypes', JSON.stringify(productTypesArray));
      console.log('[DATA SYNC] Saved product types to localStorage:', productTypesArray);
      
      setError('');
    } catch (err) {
      console.error('[DATA SYNC ERROR] Failed to sync products from API:', err);
      // Don't set error here since we already have data from localStorage
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Log data source attempt
      console.log('[DATA SOURCE] Attempting to fetch products from API: /api/inventory');
      
      const response = await axios.get('/api/inventory');
      
      // Log successful API response
      console.log('[DATA SOURCE] Successfully fetched data from API:', response.data);
      console.log('[DATA SOURCE] Response status:', response.status);
      console.log('[DATA SOURCE] Number of products received:', response.data.length);
      
      // Transform the data to match our Product interface
      const transformedProducts = response.data.map((item: any) => {
        // Log each product transformation
        console.log('[DATA TRANSFORM] Processing product:', item);
        console.log('[DATA TRANSFORM] Original productType:', item.productType);
        console.log('[DATA TRANSFORM] Original category:', item.category);
        
        // Preserve the original productType if it exists
        const preservedProductType = item.productType !== undefined ? item.productType : 'Traded';
        
        return {
          id: item.id,
          sku: item.sku,
          name: item.name,
          productType: preservedProductType,
          productType2: item.productType2 || (preservedProductType === 'Manufactured' ? 'Custom' : 'Standard'),
          productCategory: item.category || 'General',
          quantity: item.quantity,
          costPricePerPiece: item.costPricePerPiece || item.price || 0,
          ratePerPiece: item.ratePerPiece || (item.price * 1.2) || 0,
          costPricePerInch: item.costPricePerInch,
          ratePerInch: item.ratePerInch
        };
      });

      // Log transformation results
      console.log('[DATA TRANSFORM] Transformed products:', transformedProducts);
      
      // Check if localStorage has any inventory data
      const localData = localStorage.getItem('inventoryProducts');
      if (localData) {
        console.log('[DATA SOURCE] Found inventory data in localStorage:', JSON.parse(localData));
      } else {
        console.log('[DATA SOURCE] No inventory data found in localStorage');
      }
      
      // Check if we have categories in localStorage
      const savedCategories = localStorage.getItem('inventoryCategories');
      if (savedCategories) {
        console.log('[DATA SOURCE] Found categories in localStorage:', JSON.parse(savedCategories));
      } else {
        console.log('[DATA SOURCE] No categories found in localStorage');
      }
      
      setProducts(transformedProducts);
      
      // Save to localStorage
      localStorage.setItem('inventoryProducts', JSON.stringify(transformedProducts));
      console.log('[DATA SOURCE] Saved products to localStorage');
      
      // Create and save product types map
      const productTypesMap = new Map();
      transformedProducts.forEach(product => {
        productTypesMap.set(product.id, product.productType);
      });
      
      // Convert Map to array of entries and save to localStorage
      const productTypesArray = Array.from(productTypesMap.entries());
      localStorage.setItem('inventoryProductTypes', JSON.stringify(productTypesArray));
      console.log('[DATA SOURCE] Saved product types to localStorage:', productTypesArray);
      
      setError('');
    } catch (err) {
      console.error('[DATA SOURCE ERROR] Failed to fetch products from API:', err);
      
      // Try to load from localStorage as fallback
      const localData = localStorage.getItem('inventoryProducts');
      if (localData) {
        try {
          const parsedData = JSON.parse(localData);
          console.log('[DATA SOURCE] Using fallback data from localStorage:', parsedData);
          setProducts(parsedData);
          setError('');
          
          // Show notification to user that they're viewing cached data
          setTimeout(() => {
            alert('You are viewing cached data. Some features may be limited.');
          }, 500);
        } catch (parseErr) {
          console.error('[DATA SOURCE ERROR] Failed to parse localStorage data:', parseErr);
          setError('Failed to load product data');
        }
      } else {
        console.error('[DATA SOURCE ERROR] No fallback data available in localStorage');
        setError('Failed to fetch products and no local data available');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Check if product type is changing to Manufactured and category to Laddu Gopal Base
    const updatedProduct = {
      ...newProduct,
      [name]: name === 'quantity' || name === 'costPricePerPiece' || name === 'ratePerPiece' || name === 'costPricePerInch' || name === 'ratePerInch'
        ? value === '' ? undefined : Number(value)
        : value
    };

    // If product type is Manufactured and category is Laddu Gopal Base or Laddu Gopal Dress, set piece-based pricing to null
    if (updatedProduct.productType === 'Manufactured' && (updatedProduct.productCategory === 'Laddu Gopal Base' || updatedProduct.productCategory === 'Laddu Gopal Dress')) {
      updatedProduct.costPricePerPiece = undefined;
      updatedProduct.ratePerPiece = undefined;
    }

    setNewProduct(updatedProduct);
  };

  const handleAddProduct = async () => {
    // Form validation
    if (!newProduct.sku || !newProduct.name || !newProduct.productCategory) {
      alert('SKU, Name, and Product Category are required');
      return;
    }

    try {
      // Prepare data for backend with default values
      const dataToSend: any = {
        sku: newProduct.sku || 'SKU-' + Date.now(),
        name: newProduct.name || 'Unnamed Product',
        quantity: newProduct.quantity || 0,
        category: newProduct.productCategory || 'General',
        productType: newProduct.productType,
        productType2: newProduct.productType2,
        costPricePerPiece: newProduct.costPricePerPiece,
        ratePerPiece: newProduct.ratePerPiece
      };

      // Add inch-based pricing if applicable
      if (newProduct.productType === 'Manufactured' && (newProduct.productCategory === 'Laddu Gopal Base' || newProduct.productCategory === 'Laddu Gopal Dress')) {
        dataToSend.costPricePerInch = newProduct.costPricePerInch || 0;
        dataToSend.ratePerInch = newProduct.ratePerInch || 0;
        // Remove piece-based pricing for manufactured products with specific categories
        dataToSend.costPricePerPiece = null;
        dataToSend.ratePerPiece = null;
      }

      // Log data being sent to backend
      console.log('Sending data to backend:', JSON.stringify(dataToSend, null, 2));

      const response = await axios.post('/api/inventory', dataToSend);

      // Log response from backend
      console.log('Response from backend:', JSON.stringify(response, null, 2));

      // Add the new product to the list
      const addedProduct = {
        ...newProduct,
        id: response.data.id || Math.random().toString(36).substr(2, 9)
      };

      console.log('[DATA PERSISTENCE] Adding new product to state:', addedProduct);
      
      // Save to localStorage as backup
      const updatedProducts = [...products, addedProduct as Product];
      localStorage.setItem('inventoryProducts', JSON.stringify(updatedProducts));
      console.log('[DATA PERSISTENCE] Saved updated products to localStorage');
      
      // Update product types in localStorage
      const productTypesMap = new Map();
      updatedProducts.forEach(product => {
        productTypesMap.set(product.id, product.productType);
      });
      
      // Convert Map to array of entries and save to localStorage
      const productTypesArray = Array.from(productTypesMap.entries());
      localStorage.setItem('inventoryProductTypes', JSON.stringify(productTypesArray));
      console.log('[DATA PERSISTENCE] Updated product types in localStorage:', productTypesArray);
      
      setProducts(updatedProducts);
      
      // Reset form
      setNewProduct({
        sku: '',
        name: '',
        productType: 'Traded',
        productCategory: '',
        quantity: 0,
        costPricePerPiece: 0,
        ratePerPiece: 0,
        costPricePerInch: undefined,
        ratePerInch: undefined
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding product:', err);
      alert('Failed to add product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      sku: product.sku,
      name: product.name,
      productType: product.productType,
      productCategory: product.productCategory,
      quantity: product.quantity,
      costPricePerPiece: product.costPricePerPiece,
      ratePerPiece: product.ratePerPiece,
      costPricePerInch: product.costPricePerInch,
      ratePerInch: product.ratePerInch
    });
    setShowAddForm(true);
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      // Prepare data for backend
      const dataToSend: any = {
        sku: newProduct.sku,
        name: newProduct.name,
        quantity: newProduct.quantity,
        category: newProduct.productCategory,
        productType: newProduct.productType,
        productType2: newProduct.productType2,
        costPricePerPiece: newProduct.costPricePerPiece,
        ratePerPiece: newProduct.ratePerPiece
      };

      // Add inch-based pricing if applicable
      if (newProduct.productType === 'Manufactured' && (newProduct.productCategory === 'Laddu Gopal Base' || newProduct.productCategory === 'Laddu Gopal Dress')) {
        dataToSend.costPricePerInch = newProduct.costPricePerInch || 0;
        dataToSend.ratePerInch = newProduct.ratePerInch || 0;
        // Remove piece-based pricing for manufactured products with specific categories
        dataToSend.costPricePerPiece = null;
        dataToSend.ratePerPiece = null;
      } else {
        // Ensure inch-based pricing is null for other product types/categories
        dataToSend.costPricePerInch = null;
        dataToSend.ratePerInch = null;
      }

      // Log data being sent to backend
      console.log('Updating product with data:', JSON.stringify(dataToSend, null, 2));

      await axios.put(`/api/inventory/${editingProduct.id}`, dataToSend);

      // Update the product in the list
      const updatedProducts = products.map(p =>
        p.id === editingProduct.id ? { ...newProduct, id: editingProduct.id } as Product : p
      );

      console.log('[DATA PERSISTENCE] Updating product in state:', { ...newProduct, id: editingProduct.id });
      
      // Save to localStorage as backup
      localStorage.setItem('inventoryProducts', JSON.stringify(updatedProducts));
      console.log('[DATA PERSISTENCE] Saved updated products to localStorage after update');
      
      // Update product types in localStorage
      const productTypesMap = new Map();
      updatedProducts.forEach(product => {
        productTypesMap.set(product.id, product.productType);
      });
      
      // Convert Map to array of entries and save to localStorage
      const productTypesArray = Array.from(productTypesMap.entries());
      localStorage.setItem('inventoryProductTypes', JSON.stringify(productTypesArray));
      console.log('[DATA PERSISTENCE] Updated product types in localStorage after update:', productTypesArray);
      
      setProducts(updatedProducts);
      setNewProduct({
        sku: '',
        name: '',
        productType: 'Traded',
        productCategory: '',
        quantity: 0,
        costPricePerPiece: 0,
        ratePerPiece: 0,
        costPricePerInch: undefined,
        ratePerInch: undefined
      });
      setEditingProduct(null);
      setShowAddForm(false);
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Failed to update product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const productToDelete = products.find(p => p.id === id);
        console.log('[DATA PERSISTENCE] Deleting product:', productToDelete);
        
        await axios.delete(`/api/inventory/${id}`);
        
        const updatedProducts = products.filter(product => product.id !== id);
        
        // Save to localStorage as backup
        localStorage.setItem('inventoryProducts', JSON.stringify(updatedProducts));
        console.log('[DATA PERSISTENCE] Saved updated products to localStorage after delete');
        
        // Update product types in localStorage
        const productTypesMap = new Map();
        updatedProducts.forEach(product => {
          productTypesMap.set(product.id, product.productType);
        });
        
        // Convert Map to array of entries and save to localStorage
        const productTypesArray = Array.from(productTypesMap.entries());
        localStorage.setItem('inventoryProductTypes', JSON.stringify(productTypesArray));
        console.log('[DATA PERSISTENCE] Updated product types in localStorage after delete:', productTypesArray);
        
        setProducts(updatedProducts);
      } catch (err) {
        console.error('[DATA SOURCE ERROR] Error deleting product:', err);
        alert('Failed to delete product');
      }
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() === '') {
      alert('Please enter a category name');
      return;
    }

    if (categories.includes(newCategory.trim())) {
      alert('Category already exists');
      return;
    }

    const updatedCategories = [...categories, newCategory.trim()];
    setCategories(updatedCategories);
    setNewCategory('');
    setShowAddCategory(false);
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting
  useEffect(() => {
    if (sortConfig !== null) {
      const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      setFilteredProducts(sortedProducts);
    }
  }, [sortConfig]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Advanced Inventory Management</h2>
      <p>Manage your inventory with advanced features for product types and categories.</p>

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            {showAddForm ? 'Cancel' : 'Add New Product'}
          </button>
          <button
            onClick={() => {
              const csvContent = [
                'SKU,Name,Product Type,Product Category,Quantity,Cost Price per Piece,Rate per Piece,Cost Price per Inch,Rate per Inch',
                ...products.map(p => `${p.sku},${p.name},${p.productType},${p.productCategory},${p.quantity},${p.costPricePerPiece},${p.ratePerPiece},${p.costPricePerInch || '-'},${p.ratePerInch || '-'}`)
              ].join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              link.setAttribute('download', 'inventory.csv');
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Export to CSV
          </button>
          
          {isAdmin && (
            <>
              <button
                onClick={syncProductTypesToServer}
                style={{
                  backgroundColor: syncStatus === 'success' ? '#4CAF50' : 
                                 syncStatus === 'error' ? '#f44336' : 
                                 syncStatus === 'syncing' ? '#FF9800' : '#9C27B0',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginLeft: '10px'
                }}
                disabled={syncStatus === 'syncing'}
              >
                {syncStatus === 'syncing' ? 'Syncing...' : 
                 syncStatus === 'success' ? 'Synced!' : 
                 syncStatus === 'error' ? 'Sync Failed' : 'Sync to Server'}
              </button>
              <button
                onClick={fetchProductTypesFromServer}
                style={{
                  backgroundColor: '#607D8B',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginLeft: '10px'
                }}
              >
                Load from Server
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>

      {showAddForm && (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          
          {/* Product Type and Category - Top Hierarchy */}
          <div style={{ 
            backgroundColor: '#f0f7ff', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #b3d4fc'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              <div style={{ borderLeft: '4px solid #2196F3', paddingLeft: '10px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2196F3', fontSize: '16px' }}>Product Type</label>
                <select
                  name="productType"
                  value={newProduct.productType}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #2196F3', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="Traded">Traded</option>
                  <option value="Manufactured">Manufactured</option>
                </select>
              </div>
              <div style={{ borderLeft: '4px solid #FF9800', paddingLeft: '10px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#FF9800', fontSize: '16px' }}>Product Type 2</label>
                <select
                  name="productType2"
                  value={newProduct.productType2}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="Standard">Standard</option>
                  <option value="Custom">Custom</option>
                  <option value="Premium">Premium</option>
                  <option value="Basic">Basic</option>
                </select>
              </div>

              <div style={{ borderLeft: '4px solid #2196F3', paddingLeft: '10px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2196F3', fontSize: '16px' }}>Product Category</label>
                <div style={{ display: 'flex' }}>
                  <select
                    name="productCategory"
                    value={newProduct.productCategory}
                    onChange={handleInputChange}
                    style={{
                      width: showAddCategory ? '70%' : '100%',
                      padding: '10px',
                      border: '1px solid #2196F3',
                      borderRadius: '4px',
                      marginRight: showAddCategory ? '5px' : '0',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    <option value="add_new">+ Add New</option>
                  </select>

                  {showAddCategory && (
                    <div style={{ display: 'flex', width: '30%' }}>
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="New category"
                        style={{
                          width: '70%',
                          padding: '10px',
                          border: '1px solid #2196F3',
                          borderRadius: '4px 0 0 4px',
                          marginRight: '2px',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        onClick={handleAddCategory}
                        style={{
                          width: '30%',
                          padding: '10px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0 4px 4px 0',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Other Product Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>SKU</label>
              <input
                type="text"
                name="sku"
                value={newProduct.sku}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Enter SKU"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Name</label>
              <input
                type="text"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={newProduct.quantity}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Enter quantity"
                min="0"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Cost Price per Piece</label>
              <input
                type="number"
                name="costPricePerPiece"
                value={newProduct.costPricePerPiece}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: (newProduct.productType === 'Manufactured' && (newProduct.productCategory === 'Laddu Gopal Dress' || newProduct.productCategory === 'Laddu Gopal Base')) ? '#f5f5f5' : 'white' }}
                placeholder="Enter cost price"
                step="0.01"
                disabled={newProduct.productType === 'Manufactured' && (newProduct.productCategory === 'Laddu Gopal Dress' || newProduct.productCategory === 'Laddu Gopal Base')}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Rate per Piece</label>
              <input
                type="number"
                name="ratePerPiece"
                value={newProduct.ratePerPiece}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: (newProduct.productType === 'Manufactured' && (newProduct.productCategory === 'Laddu Gopal Dress' || newProduct.productCategory === 'Laddu Gopal Base')) ? '#f5f5f5' : 'white' }}
                placeholder="Enter rate per piece"
                step="0.01"
                disabled={newProduct.productType === 'Manufactured' && (newProduct.productCategory === 'Laddu Gopal Dress' || newProduct.productCategory === 'Laddu Gopal Base')}
              />
            </div>

            {/* Show inch-based pricing fields only for Manufactured Laddu Gopal Dress and Laddu Gopal Base */}
            {newProduct.productType === 'Manufactured' && (newProduct.productCategory === 'Laddu Gopal Dress' || newProduct.productCategory === 'Laddu Gopal Base') && (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Cost Price per Inch</label>
                  <input
                    type="number"
                    name="costPricePerInch"
                    value={newProduct.costPricePerInch || ''}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    placeholder="Enter cost price per inch"
                    step="0.01"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Rate per Inch</label>
                  <input
                    type="number"
                    name="ratePerInch"
                    value={newProduct.ratePerInch || ''}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    placeholder="Enter rate per inch"
                    step="0.01"
                  />
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingProduct(null);
                setNewProduct({
                  sku: '',
                  name: '',
                  productType: 'Traded',
                  productCategory: '',
                  quantity: 0,
                  costPricePerPiece: 0,
                  ratePerPiece: 0,
                  costPricePerInch: undefined,
                  ratePerInch: undefined
                });
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
              style={{
                padding: '8px 16px',
                backgroundColor: editingProduct ? '#2196F3' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading products...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2', color: '#333' }}>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    border: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => requestSort('sku')}
                >
                  SKU {sortConfig?.key === 'sku' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    border: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => requestSort('name')}
                >
                  Name {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    border: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => requestSort('productType')}
                >
                  Product Type {sortConfig?.key === 'productType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    border: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => requestSort('productType2')}
                >
                  Product Type 2 {sortConfig?.key === 'productType2' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    border: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => requestSort('productCategory')}
                >
                  Product Category {sortConfig?.key === 'productCategory' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    border: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => requestSort('quantity')}
                >
                  Quantity {sortConfig?.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    border: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => requestSort('costPricePerPiece')}
                >
                  Cost Price per Piece {sortConfig?.key === 'costPricePerPiece' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    border: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => requestSort('ratePerPiece')}
                >
                  Rate per Piece {sortConfig?.key === 'ratePerPiece' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    border: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => requestSort('costPricePerInch')}
                >
                  Cost Price per Inch {sortConfig?.key === 'costPricePerInch' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    border: '1px solid #ddd',
                    cursor: 'pointer'
                  }}
                  onClick={() => requestSort('ratePerInch')}
                >
                  Rate per Inch {sortConfig?.key === 'ratePerInch' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map(product => (
                  <tr key={product.id}>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{product.sku}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{product.name}</td>
                    <td style={{ 
                      padding: '12px', 
                      border: '1px solid #ddd',
                      fontWeight: 'bold',
                      color: product.productType === 'Manufactured' ? '#4CAF50' : '#2196F3',
                      backgroundColor: product.productType === 'Manufactured' ? '#e8f5e9' : '#e3f2fd'
                    }}>
                      {product.productType}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      border: '1px solid #ddd',
                      fontWeight: 'bold',
                      color: product.productType === 'Manufactured' ? '#FF9800' : '#9C27B0',
                      backgroundColor: product.productType === 'Manufactured' ? '#fff3e0' : '#f3e5f5'
                    }}>
                      {product.productType === 'Manufactured' ? 'Custom' : 'Standard'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{product.productCategory}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{product.quantity}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {product.costPricePerPiece !== undefined && product.costPricePerPiece !== null ? `$${product.costPricePerPiece.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {product.ratePerPiece !== undefined && product.ratePerPiece !== null ? `$${product.ratePerPiece.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {product.costPricePerInch !== undefined && product.costPricePerInch !== null ? `$${product.costPricePerInch.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      {product.ratePerInch !== undefined && product.ratePerInch !== null ? `$${product.ratePerInch.toFixed(2)}` : '-'}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => handleEditProduct(product)}
                        style={{
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          marginRight: '5px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        style={{
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                <button
                  key={pageNumber}
                  onClick={() => paginate(pageNumber)}
                  style={{
                    margin: '0 5px',
                    padding: '5px 10px',
                    backgroundColor: currentPage === pageNumber ? '#4CAF50' : '#f1f1f1',
                    color: currentPage === pageNumber ? 'white' : '#333',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdvancedInventoryTab;
