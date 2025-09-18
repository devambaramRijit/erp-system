import React, { useState, useEffect, useRef } from 'react';
import Papa from "papaparse";
import * as XLSX from "xlsx";
import axios from 'axios';

interface Product {
  id: string;
  sku: string;
  name: string;
  productType: string;
  productCategory: string;
  quantity: number;
  costPricePerPiece?: number;
  ratePerPiece?: number;
  costPricePerInch?: number;
  ratePerInch?: number;
}

const SimpleProductTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    sku: '',
    name: '',
    productType: 'Traded',
    productCategory: '',
    quantity: 0,
    costPricePerPiece: undefined,
    ratePerPiece: undefined,
    costPricePerInch: undefined,
    ratePerInch: undefined
  });

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Load products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        // Always try to fetch fresh data from backend
        const response = await axios.get('/api/inventory', { withCredentials: true });
        if (response.data) {
          // Transform server data to match client-side Product interface
          const transformedProducts = response.data.map(item => {
            console.log('Transforming item:', item);
            return {
              id: item.id,
              sku: item.sku,
              name: item.name,
              productType: item.productType || item.type || '',
              productCategory: item.category || '',
              quantity: item.quantity,
              costPricePerPiece: item.costPricePerPiece !== undefined ? item.costPricePerPiece : (item.price !== undefined ? item.price : 0),
              ratePerPiece: item.ratePerPiece !== undefined ? item.ratePerPiece : (item.price !== undefined ? item.price : 0),
              costPricePerInch: item.costPricePerInch !== undefined ? item.costPricePerInch : 0,
              ratePerInch: item.ratePerInch !== undefined ? item.ratePerInch : 0
            };
          });
          
          setProducts(transformedProducts);
          // Update localStorage with fresh data
          localStorage.setItem('simpleInventoryProducts', JSON.stringify(transformedProducts));
        } else {
          // Initialize with empty array if no data from backend
          setProducts([]);
          localStorage.setItem('simpleInventoryProducts', JSON.stringify([]));
        }

        setError(null);
      } catch (err) {
        setError('Failed to fetch products');
        console.error(err);
        // Fallback to localStorage if backend fails
        const savedProducts = localStorage.getItem('simpleInventoryProducts');
        if (savedProducts) {
          setProducts(JSON.parse(savedProducts));
        } else {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Listen for authentication errors
    const handleAuthError = () => {
      // Trigger auth refresh
      window.dispatchEvent(new CustomEvent('authRefresh'));
    };

    window.addEventListener('authError', handleAuthError);

    return () => {
      window.removeEventListener('authError', handleAuthError);
    };
  }, []);

  // Save products to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('simpleInventoryProducts', JSON.stringify(products));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('productsUpdated'));
    }
  }, [products, loading]);

  // Backup products to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('simpleInventoryProducts', JSON.stringify(products));
  }, [products]);

  // Load products from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('simpleInventoryProducts');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
          setProducts(parsedProducts);
        }
      } catch (err) {
        console.error('Error parsing saved products:', err);
      }
    }
  }, []);

  // Handle sorting
  const requestSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sorted products
  const getSortedProducts = () => {
    const sortableProducts = [...products];
    if (sortConfig !== null) {
      sortableProducts.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProducts;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = getSortedProducts().slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleEditProduct = (product: Product) => {
    console.log('Editing product:', product.name); // Debug log
    // Set the product to be edited
    setEditingProduct(product);

    // Populate the form with the product data
    setNewProduct({
      sku: product.sku,
      name: product.name,
      productType: product.productType,
      productCategory: product.productCategory,
      quantity: product.quantity,
      costPricePerPiece: product.costPricePerPiece,
      ratePerPiece: product.ratePerPiece,
      costPricePerInch: product.costPricePerInch,
      ratePerInch: product.ratePerInch,
    });

    // Show the form
    console.log('Setting showAddForm to true'); // Debug log
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // First delete from server
        await axios.delete(`/api/inventory/${id}`, { withCredentials: true });
        
        // Then update local state
        const updatedProducts = products.filter(product => product.id !== id);
        setProducts(updatedProducts);
      } catch (err) {
        setError('Failed to delete product');
        console.error(err);
        // Fallback to just updating local state if server request fails
        const updatedProducts = products.filter(product => product.id !== id);
        setProducts(updatedProducts);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: name === 'quantity' || name === 'costPricePerPiece' || name === 'ratePerPiece' || name === 'costPricePerInch' || name === 'ratePerInch'
        ? value === '' ? undefined : Number(value)
        : value
    });
  };

  const handleAddProduct = async () => {
    // Form validation
    if (!newProduct.sku || !newProduct.name || !newProduct.productCategory) {
      alert('SKU, Name, and Product Category are required');
      return;
    }

    try {
      if (editingProduct) {
        // Update existing product
        const updatedProduct: Product = {
          ...newProduct,
          id: editingProduct.id
        };

        // Special handling for Laddu Gopal Mukut - clear inch-based pricing
        if (updatedProduct.productCategory === 'Laddu Gopal Mukut') {
          updatedProduct.costPricePerInch = undefined;
          updatedProduct.ratePerInch = undefined;
        }

        // Update the product in the list
        const updatedProducts = products.map(product => 
          product.id === editingProduct.id ? updatedProduct : product
        );
        setProducts(updatedProducts);
        
        // Send the updated product to the server
        try {
          await axios.put(`/api/inventory/${editingProduct.id}`, {
            sku: updatedProduct.sku,
            name: updatedProduct.name,
            description: updatedProduct.name, // Use name as description
            quantity: updatedProduct.quantity,
            price: updatedProduct.ratePerPiece || 0, // Use ratePerPiece as price
            category: updatedProduct.productCategory,
            productType: updatedProduct.productType || '',
            costPricePerPiece: updatedProduct.costPricePerPiece || 0,
            ratePerPiece: updatedProduct.ratePerPiece || 0,
            costPricePerInch: updatedProduct.costPricePerInch || 0,
            ratePerInch: updatedProduct.ratePerInch || 0
          }, { withCredentials: true });
          
          console.log('Product updated successfully on server');
        } catch (error) {
          console.error('Failed to update product on server:', error);
          alert('Failed to update product on server. Changes may not persist.');
        }

        // Reset editing state
        setEditingProduct(null);
      } else {
        // Create a new product with ID
        const newProductWithId: Product = {
          ...newProduct,
          id: 'prod-' + Date.now()
        };

        // Special handling for Laddu Gopal Mukut - clear inch-based pricing
        if (newProductWithId.productCategory === 'Laddu Gopal Mukut') {
          newProductWithId.costPricePerInch = undefined;
          newProductWithId.ratePerInch = undefined;
        }

        // Add the new product to the list
        const updatedProducts = [...products, newProductWithId];
        setProducts(updatedProducts);
      }

      // Reset form
      setNewProduct({
        sku: '',
        name: '',
        productType: '', // Empty string instead of defaulting to Traded
        productCategory: '',
        quantity: 0,
        costPricePerPiece: undefined,
        ratePerPiece: undefined,
        costPricePerInch: undefined,
        ratePerInch: undefined
      });
      setShowAddForm(false);
    } catch (err) {
      setError('Failed to add product');
      console.error(err);
    }
  };

  // Function to download CSV template
  const downloadTemplate = () => {
    // Create a template with headers as specified in the requirements
    const headers = [
      'Product Type', 'SKU', 'Product Name', 'Product Category',
      'Quantity', 'Cost Price per Piece', 'Rate per Piece', 'Cost Price per Inch', 'Rate per Inch'
    ];

    // Create CSV content with headers only (no sample data as per requirements)
    let csvContent = headers.join(',') + '\n';

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle file upload (CSV or Excel) - Frontend only
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(`File selected: ${file.name}, size: ${file.size}, type: ${file.type}`);
    setImporting(true);
    setError(null);

    try {
      let rows: any[] = [];

      if (file.name.endsWith(".csv")) {
        // Parse CSV
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        rows = result.data as any[];
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        // Parse Excel
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        alert("Unsupported file type. Please upload CSV or Excel.");
        return;
      }

      console.log("Parsed rows:", rows);

      // Transform rows into Product objects
      const transformedProducts: Product[] = rows.map((item: any) => {
        const category = item["Product Category"]?.trim() || "";
        const isManufactured =
          category === "Laddu Gopal Base" ||
          category === "Laddu Gopal Dress" ||
          category === "Laddu Gopal Mukut" ||
          category === "RK Base" ||
          category === "Mata Rani Base" ||
          category === "Ganesh Lakshmi Base" ||
          category === "Shyam Baba Base";

        return {
          id: "prod-" + Date.now() + Math.random(), // unique ID
          sku: item["SKU"] || "",
          name: item["Product Name"] || "",
          productType: item["Product Type"] || "Traded",
          productCategory: category,
          quantity: Number(item["Quantity"] || 0),
          costPricePerPiece:
            item["Cost Price per Piece"] !== undefined && item["Cost Price per Piece"] !== ""
              ? Number(item["Cost Price per Piece"])
              : undefined,
          ratePerPiece:
            item["Rate per Piece"] !== undefined && item["Rate per Piece"] !== ""
              ? Number(item["Rate per Piece"])
              : undefined,
          costPricePerInch:
            item["Cost Price per Inch"] !== undefined && item["Cost Price per Inch"] !== ""
              ? Number(item["Cost Price per Inch"])
              : undefined,
          ratePerInch:
            item["Rate per Inch"] !== undefined && item["Rate per Inch"] !== ""
              ? Number(item["Rate per Inch"])
              : undefined,
        };
      });

      // Merge with existing products instead of replacing
      console.log('Previous products count:', products.length);
      console.log('Imported products count:', transformedProducts.length);
      // First save to the server
      const saveToServer = async () => {
        try {
          for (const product of transformedProducts) {
            // Transform product data to match server expectations
            const serverProduct = {
              sku: product.sku,
              name: product.name,
              category: product.productCategory, // Map productCategory to category
              description: product.name, // Use name as description
              quantity: product.quantity,
              price: product.ratePerPiece || 0, // Use ratePerPiece as price
              productType: product.productType || 'Traded', // Include the product type with a default
              costPricePerPiece: product.costPricePerPiece || 0,
              ratePerPiece: product.ratePerPiece || 0,
              costPricePerInch: product.costPricePerInch || 0,
              ratePerInch: product.ratePerInch || 0
            };
            
            // Log the data being sent to server
            console.log('Sending to server:', JSON.stringify(serverProduct, null, 2));
            
            await axios.post('/api/inventory', serverProduct, { withCredentials: true });
          }
          console.log('All products saved to server successfully');
          
          // After successful server save, update local state
          setProducts((prevProducts) => {
            console.log('Prev products count:', prevProducts.length);
            const newProducts = [...prevProducts, ...transformedProducts];
            console.log('New products count:', newProducts.length);
            return newProducts;
          });
          alert(`Successfully imported ${transformedProducts.length} products!`);
        } catch (err) {
          console.error('Error saving products to server:', err);
          setError('Failed to save products to server');
          alert(`Error saving products to server: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      };
      
      saveToServer();
    } catch (err) {
      console.error("Error importing file:", err);
      setError("Failed to import products");
      alert(`Error importing products: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      {/* Hidden file input for CSV and Excel import */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".csv,.xlsx,.xls"
        onChange={handleFileUpload}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Product List</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={downloadTemplate}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Download CSV Template
          </button>
          <button
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            disabled={importing}
            style={{
              padding: '8px 16px',
              backgroundColor: importing ? '#90CAF9' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: importing ? 'not-allowed' : 'pointer',
              opacity: importing ? 0.7 : 1
            }}
          >
            {importing ? 'Importing...' : 'Upload Products'}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showAddForm ? 'Cancel' : 'Add Product'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ marginTop: '0', marginBottom: '15px', color: '#000' }}>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#000', fontWeight: 'bold' }}>SKU</label>
              <input
                type="text"
                name="sku"
                value={newProduct.sku}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#000', fontWeight: 'bold' }}>Product Name</label>
              <input
                type="text"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#000', fontWeight: 'bold' }}>Product Type</label>
              <select
                name="productType"
                value={newProduct.productType}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Select Type</option>
                <option value="Traded">Traded</option>
                <option value="Manufactured">Manufactured</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#000', fontWeight: 'bold' }}>Product Category</label>
              <select
                name="productCategory"
                value={newProduct.productCategory}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="">Select Category</option>
                <option value="Laddu Gopal Base">Laddu Gopal Base</option>
                <option value="Laddu Gopal Dress">Laddu Gopal Dress</option>
                <option value="Laddu Gopal Mukut">Laddu Gopal Mukut</option>
                <option value="RK Base">RK Base</option>
                <option value="Mata Rani Base">Mata Rani Base</option>
                <option value="Ganesh Lakshmi Base">Ganesh Lakshmi Base</option>
                <option value="Shyam Baba Base">Shyam Baba Base</option>
                <option value="Fabric">Fabric</option>
                <option value="Lace">Lace</option>
                <option value="Booti">Booti</option>
                <option value="Crystal Painting 16x16">Crystal Painting 16x16</option>
                <option value="Crystal Painting 12x18">Crystal Painting 12x18</option>
                <option value="Sparkle Painting 12x18">Sparkle Painting 12x18</option>
                <option value="Gold Painting 12x18">Gold Painting 12x18</option>
                <option value="Crystal Painting 10x12">Crystal Painting 10x12</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#000', fontWeight: 'bold' }}>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={newProduct.quantity}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#000', fontWeight: 'bold' }}>Cost Price per Piece</label>
              <input
                type="number"
                name="costPricePerPiece"
                value={newProduct.costPricePerPiece || ''}
                onChange={handleInputChange}
                disabled={newProduct.productType === 'Manufactured' && (
                  newProduct.productCategory === 'Laddu Gopal Base' ||
                  newProduct.productCategory === 'RK Base' ||
                  newProduct.productCategory === 'Mata Rani Base' ||
                  newProduct.productCategory === 'Ganesh Lakshmi Base' ||
                  newProduct.productCategory === 'Shyam Baba Base'
                )}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  backgroundColor: newProduct.productType === 'Manufactured' && (
                    newProduct.productCategory === 'Laddu Gopal Base' ||
                    newProduct.productCategory === 'RK Base' ||
                    newProduct.productCategory === 'Mata Rani Base' ||
                    newProduct.productCategory === 'Ganesh Lakshmi Base' ||
                    newProduct.productCategory === 'Shyam Baba Base'
                  ) ? '#f5f5f5' : 'white'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#000', fontWeight: 'bold' }}>Rate per Piece</label>
              <input
                type="number"
                name="ratePerPiece"
                value={newProduct.ratePerPiece || ''}
                onChange={handleInputChange}
                disabled={newProduct.productType === 'Manufactured' && (
                  newProduct.productCategory === 'Laddu Gopal Base' ||
                  newProduct.productCategory === 'RK Base' ||
                  newProduct.productCategory === 'Mata Rani Base' ||
                  newProduct.productCategory === 'Ganesh Lakshmi Base' ||
                  newProduct.productCategory === 'Shyam Baba Base'
                )}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  backgroundColor: newProduct.productType === 'Manufactured' && (
                    newProduct.productCategory === 'Laddu Gopal Base' ||
                    newProduct.productCategory === 'RK Base' ||
                    newProduct.productCategory === 'Mata Rani Base' ||
                    newProduct.productCategory === 'Ganesh Lakshmi Base' ||
                    newProduct.productCategory === 'Shyam Baba Base'
                  ) ? '#f5f5f5' : 'white'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#000', fontWeight: 'bold' }}>Cost Price per Inch</label>
              <input
                type="number"
                name="costPricePerInch"
                value={newProduct.costPricePerInch || ''}
                onChange={handleInputChange}
                disabled={newProduct.productType === 'Traded' || (newProduct.productType === 'Manufactured' && newProduct.productCategory === 'Laddu Gopal Mukut')}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  backgroundColor: newProduct.productType === 'Traded' || (newProduct.productType === 'Manufactured' && newProduct.productCategory === 'Laddu Gopal Mukut') ? '#f5f5f5' : 'white'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#000', fontWeight: 'bold' }}>Rate per Inch</label>
              <input
                type="number"
                name="ratePerInch"
                value={newProduct.ratePerInch || ''}
                onChange={handleInputChange}
                disabled={newProduct.productType === 'Traded' || (newProduct.productType === 'Manufactured' && newProduct.productCategory === 'Laddu Gopal Mukut')}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  backgroundColor: newProduct.productType === 'Traded' || (newProduct.productType === 'Manufactured' && newProduct.productCategory === 'Laddu Gopal Mukut') ? '#f5f5f5' : 'white'
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleAddProduct}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
            {editingProduct && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setNewProduct({
                    sku: '',
                    name: '',
                    productType: '',
                    productCategory: '',
                    quantity: 0,
                    costPricePerPiece: undefined,
                    ratePerPiece: undefined,
                    costPricePerInch: undefined,
                    ratePerInch: undefined
                  });
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginLeft: '10px'
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading products...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
              <tr style={{ backgroundColor: '#4a5568', color: 'white', fontWeight: 'bold' }}>
                <th style={{ padding: '12px 15px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }} onClick={() => requestSort('productType')}>
                  Product Type {sortConfig?.key === 'productType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px 15px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }} onClick={() => requestSort('sku')}>
                  SKU {sortConfig?.key === 'sku' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px 15px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }} onClick={() => requestSort('name')}>
                  Product Name {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px 15px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }} onClick={() => requestSort('productCategory')}>
                  Product Category {sortConfig?.key === 'productCategory' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px 15px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }} onClick={() => requestSort('quantity')}>
                  Quantity {sortConfig?.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px 15px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }} onClick={() => requestSort('costPricePerPiece')}>
                  Cost Price per Piece {sortConfig?.key === 'costPricePerPiece' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px 15px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }} onClick={() => requestSort('ratePerPiece')}>
                  Rate per Piece {sortConfig?.key === 'ratePerPiece' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px 15px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }} onClick={() => requestSort('costPricePerInch')}>
                  Cost Price per Inch {sortConfig?.key === 'costPricePerInch' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px 15px', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }} onClick={() => requestSort('ratePerInch')}>
                  Rate per Inch {sortConfig?.key === 'ratePerInch' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px 15px', border: 'none', textAlign: 'left', fontWeight: 'bold' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(product => {
                // Debug: log the product data being rendered
                console.log('Rendering product:', {
                  id: product.id,
                  name: product.name,
                  productType: product.productType,
                  costPricePerPiece: product.costPricePerPiece,
                  ratePerPiece: product.ratePerPiece,
                  costPricePerInch: product.costPricePerInch,
                  ratePerInch: product.ratePerInch
                });
                
                return (
                <tr key={product.id} style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', color: '#000' }}>
                  <td style={{ padding: '12px 15px', border: 'none' }}>{product.productType || '-'}</td>
                  <td style={{ padding: '12px 15px', border: 'none' }}>{product.sku}</td>
                  <td style={{ padding: '12px 15px', border: 'none' }}>{product.name}</td>
                  <td style={{ padding: '12px 15px', border: 'none' }}>{product.productCategory || '-'}</td>
                  <td style={{ padding: '12px 15px', border: 'none' }}>{product.quantity}</td>
                  <td style={{ padding: '12px 15px', border: 'none' }}>
                    {product.costPricePerPiece != null ? `₹${product.costPricePerPiece.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '12px 15px', border: 'none' }}>
                    {product.ratePerPiece != null ? `₹${product.ratePerPiece.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '12px 15px', border: 'none' }}>
                    {product.costPricePerInch != null ? `₹${product.costPricePerInch.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '12px 15px', border: 'none' }}>
                    {product.ratePerInch != null ? `₹${product.ratePerInch.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: '12px 15px', border: 'none' }}>
                    <button
                      onClick={() => handleEditProduct(product)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#4299e1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '8px',
                        fontWeight: '500',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f56565',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
              <button
                key={pageNumber}
                onClick={() => paginate(pageNumber)}
                style={{
                  padding: '8px 12px',
                  margin: '0 5px',
                  backgroundColor: currentPage === pageNumber ? '#2196F3' : '#f2f2f2',
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
        </>
      )}
    </div>
  );
};

export default SimpleProductTab;
