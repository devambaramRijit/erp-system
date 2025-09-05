import React, { useState, useEffect } from 'react';
import { api } from './lib/api';

interface Product {
  id: string;
  sku: string;
  name: string;
  productType: 'Manufactured' | 'Traded';
  productCategory: string;
  quantity: number;
  costPricePerPiece: number;
  ratePerPiece: number;
  costPricePerInch?: number;  // Optional field for Manufactured Laddu Gopal Dress
  ratePerInch?: number;         // Optional field for Manufactured Laddu Gopal Dress
}

const SecondProductListTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
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

  // Load categories from localStorage on component mount
  useEffect(() => {
    const savedProductTypes = localStorage.getItem('inventoryProductTypes');
    if (savedProductTypes) {
      const productTypesData = JSON.parse(savedProductTypes);
      setCategories(productTypesData);
    }
    
    fetchProducts();
  }, []);

  // Load form state from localStorage
  useEffect(() => {
    const savedFormState = localStorage.getItem('inventoryFormState');
    if (savedFormState) {
      try {
        const formState = JSON.parse(savedFormState);
        setNewProduct(formState);
      } catch (err) {
        console.error('Error parsing form state from localStorage:', err);
      }
    }
  }, []);

  // Save form state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('inventoryFormState', JSON.stringify(newProduct));
  }, [newProduct]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/inventory');
      // Transform the data to match our Product interface
      const transformedProducts = response.map((item: any) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        productType: item.productType || (item.category && (item.category.includes('Manufactured') || item.category.includes('Laddu Gopal')) ? 'Manufactured' : 'Traded'),
        productCategory: item.category || 'General',
        quantity: item.quantity,
        costPricePerPiece: item.price,
        ratePerPiece: item.price * 1.2, // Example calculation
        costPricePerInch: item.costPricePerInch,
        ratePerInch: item.ratePerInch
      }));
      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);
      
      // Extract unique categories from products
      const uniqueCategories = Array.from(new Set(transformedProducts.map(p => p.productCategory).filter(Boolean))) as string[];
      
      // Get existing categories from localStorage
      const savedProductTypes = localStorage.getItem('inventoryProductTypes');
      const existingCategories = savedProductTypes ? JSON.parse(savedProductTypes) : [];
      
      // Merge existing categories with new unique categories
      const mergedCategories = Array.from(new Set([...existingCategories, ...uniqueCategories]));
      
      // Save merged categories to localStorage
      localStorage.setItem('inventoryProductTypes', JSON.stringify(mergedCategories));
      setCategories(mergedCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Handle search
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
    setCurrentPage(1);
  }, [searchTerm, products]);

  // Handle sorting
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Check if product type is changing to Manufactured and category to Laddu Gopal Base
    const updatedProduct = {
      ...newProduct,
      [name]: name === 'quantity' || name === 'costPricePerPiece' || name === 'ratePerPiece' || name === 'costPricePerInch' || name === 'ratePerInch'
        ? value === '' ? undefined : Number(value)
        : value
    };
    
    // If product type is Manufactured and category is Laddu Gopal Base, set piece-based pricing to null
    if (updatedProduct.productType === 'Manufactured' && updatedProduct.productCategory === 'Laddu Gopal Base') {
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
        price: newProduct.costPricePerPiece || 0,
        category: newProduct.productCategory || 'General',
        productType: newProduct.productType
      };
      

      
      // Log data being sent to backend
      console.log('Sending data to backend:', JSON.stringify(dataToSend, null, 2));

      const response = await api.post('/inventory', dataToSend);

      // Log response from backend
      console.log('Response from backend:', JSON.stringify(response, null, 2));

      // Add the new product to the list
      const addedProduct: Product = {
        id: response.id,
        ...newProduct
      };

      const updatedProducts = [...products, addedProduct];
      setProducts(updatedProducts);
      
      // Save to localStorage
      localStorage.setItem('inventoryProducts', JSON.stringify(updatedProducts));
      
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
      // Prepare data for backend with default values
      const dataToSend: any = {
        sku: newProduct.sku || 'SKU-' + Date.now(),
        name: newProduct.name || 'Unnamed Product',
        quantity: newProduct.quantity || 0,
        price: newProduct.costPricePerPiece || 0,
        category: newProduct.productCategory || 'General',
        costPricePerInch: newProduct.costPricePerInch || 0,
        ratePerInch: newProduct.ratePerInch || 0,
        productType: newProduct.productType
      };
      

      
      // Log data being sent to backend
      console.log('Updating product with data:', JSON.stringify(dataToSend, null, 2));
      
      await api.put(`/inventory/${editingProduct.id}`, dataToSend);

      const updatedProducts = products.map(product =>
        product.id === editingProduct.id ? { ...newProduct, id: editingProduct.id } : product
      );

      setProducts(updatedProducts);
      
      // Save to localStorage
      localStorage.setItem('inventoryProducts', JSON.stringify(updatedProducts));
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
        await api.delete(`/inventory/${id}`);
        const updatedProducts = products.filter(product => product.id !== id);
        setProducts(updatedProducts);
        
        // Save to localStorage
        localStorage.setItem('inventoryProducts', JSON.stringify(updatedProducts));
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Failed to delete product');
      }
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updatedCategories = [...categories, newCategory.trim()];
      setCategories(updatedCategories);
      setNewProduct({...newProduct, productCategory: newCategory.trim()});
      setNewCategory('');
      setShowAddCategory(false);
      
      // Save to localStorage for persistence
      localStorage.setItem('inventoryProductTypes', JSON.stringify(updatedCategories));
    }
  };

  const exportToCSV = () => {
    const headers = ['SKU', 'Name', 'Product Type', 'Product Category', 'Quantity', 'Cost Price per Piece', 'Rate per Piece', 'Cost Price per Inch', 'Rate per Inch'];
    const csvContent = [
      headers.join(','),
      ...filteredProducts.map(product => [
        product.sku,
        product.name,
        product.productType,
        product.productCategory,
        product.quantity,
        product.costPricePerPiece,
        product.ratePerPiece,
        product.costPricePerInch || '',
        product.ratePerInch || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_list.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Product Management</h2>
        <div>
          <button 
            onClick={() => setShowAddForm(true)} 
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
            Add New Product
          </button>
          <button 
            onClick={exportToCSV} 
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Product Type</label>
              <select
                name="productType"
                value={newProduct.productType}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="Manufactured">Manufactured</option>
                <option value="Traded">Traded</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>Product Category</label>
              <div style={{ display: 'flex' }}>
                <select
                  name="productCategory"
                  value={newProduct.productCategory}
                  onChange={handleInputChange}
                  style={{ 
                    width: showAddCategory ? '70%' : '100%', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    marginRight: showAddCategory ? '5px' : '0'
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
                        padding: '8px', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px 0 0 4px',
                        marginRight: '2px'
                      }}
                    />
                    <button 
                      onClick={handleAddCategory}
                      style={{ 
                        width: '30%', 
                        padding: '8px', 
                        backgroundColor: '#4CAF50', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '0 4px 4px 0',
                        cursor: 'pointer' 
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

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
                backgroundColor: '#f44336', 
                color: 'white', 
                border: 'none', 
                padding: '10px 15px', 
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
                backgroundColor: '#4CAF50', 
                color: 'white', 
                border: 'none', 
                padding: '10px 15px', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
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
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{product.productType}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{product.productCategory}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{product.quantity}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {product.costPricePerPiece !== undefined ? `$${product.costPricePerPiece.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {product.ratePerPiece !== undefined ? `$${product.ratePerPiece.toFixed(2)}` : '-'}
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
                <td colSpan={8} style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
            <button
              key={pageNumber}
              onClick={() => paginate(pageNumber)}
              style={{
                margin: '0 5px',
                padding: '8px 12px',
                backgroundColor: currentPage === pageNumber ? '#4CAF50' : '#f2f2f2',
                color: currentPage === pageNumber ? 'white' : 'black',
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

      {/* Handle "Add New" category selection */}
      {newProduct.productCategory === 'add_new' && !showAddCategory && (
        <div>
          {setShowAddCategory(true)}
        </div>
      )}
    </div>
  );
};

export default SecondProductListTab;
