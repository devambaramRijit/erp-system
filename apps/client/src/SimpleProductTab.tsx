import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Papa from "papaparse";
import * as XLSX from "xlsx";
import axios from 'axios';

// Set correct API URL
axios.defaults.baseURL = 'http://192.168.0.107:3000/api';
import {
  Button,
  Modal,
  Form,
  Space,
  message,
  Spin,
  Alert,
  Card,
  Empty,
} from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import ProductPageHeader from './components/ProductPageHeader';
import ProductTable from './components/ProductTable';
import ProductForm from './components/ProductForm';
import ProductStats from './components/ProductStats';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Load products from backend
  const fetchProducts = useCallback(async () => {
      try {
        setLoading(true);
        const response = await axios.get('/inventory', { withCredentials: true });
        if (response.data) {
          // Transform server data to match client-side Product interface
          const transformedProducts = response.data.map((item: any) => ({
            id: item.id,
            sku: item.sku || '',
            name: item.name || '',
            productType: item.productType || 'Traded',
            productCategory: item.category || '',
            quantity: Number(item.quantity) || 0,
            costPricePerPiece: item.costPricePerPiece,
            ratePerPiece: item.ratePerPiece,
            costPricePerInch: item.costPricePerInch,
            ratePerInch: item.ratePerInch,
          }));
          
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
    }, []);

  useEffect(() => {
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
  }, [fetchProducts]);

  // Save products to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('simpleInventoryProducts', JSON.stringify(products));
    }
  }, [products, loading]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) {
      return products;
    }
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCategory.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);


  const productCategories = useMemo(() => {
    const categories = new Set(products.map(p => p.productCategory).filter(Boolean));
    return Array.from(categories);
  }, [products]);
  
  const { totalProducts, totalStock, totalValue } = useMemo(() => {
    const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalValue = products.reduce((sum, p) => {
      const cost = p.costPricePerPiece || 0;
      return sum + (p.quantity || 0) * cost;
    }, 0);
    return { totalProducts: products.length, totalStock, totalValue };
  }, [products]);
  
  const handleEditProduct = (product: Product) => {
    console.log('Editing product:', product.name); // Debug log
    // Set the product to be edited
    setEditingProduct(product);

    // Populate the form with the product data
    form.setFieldsValue({
      sku: product.sku,
      name: product.name,
      productType: product.productType || 'Traded',
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
    Modal.confirm({
      title: 'Are you sure you want to delete this product?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
      try {
        // First delete from server
        await axios.delete(`/inventory/${id}`, { withCredentials: true });
        
        // Then update local state
        const updatedProducts = products.filter(product => product.id !== id);
        setProducts(updatedProducts);
        message.success('Product deleted successfully!');
      } catch (err) {
        setError('Failed to delete product');
        console.error(err);
        message.error('Failed to delete product.');
      }
     }
    });
  };

  const handleDeleteAllProducts = async () => {
    Modal.confirm({
      title: 'Are you sure you want to delete ALL products?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action is irreversible and will delete all products from the database.',
      okText: 'Yes, delete all',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // First delete from server
          await axios.delete('/inventory/all', { withCredentials: true });
          
          // Then update local state
          setProducts([]);
          message.success('All products deleted successfully!');
        } catch (err) {
          setError('Failed to delete all products');
          console.error(err);
          message.error('Failed to delete all products.');
        }
      }
    });
  };

  const handleFormSubmit = async (values: any) => {
    // Form validation
    if (!values.sku || !values.name || !values.productCategory) {
      message.error('SKU, Name, and Product Category are required');
      return;
    }

    try {
      if (editingProduct) {
        // Update existing product
        const updatedProduct: Product = {
          ...values,
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
        message.success('Product updated successfully!');
        
        // Send the updated product to the server
        try {
          // First, try to find the product by SKU to get the server-generated ID
          const allProducts = await axios.get('/inventory', { withCredentials: true });
          const serverProduct = allProducts.data.find((p: any) => p.sku === updatedProduct.sku);
          
          if (serverProduct) {
            // Use the server-generated ID for the update
            await axios.put(`/inventory/${serverProduct.id}`, {
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
          } else {
            console.error('Product not found on server');
            alert('Product not found on server. Changes may not persist.');
          }
        } catch (error) {
          console.error('Failed to update product on server:', error);
          alert('Failed to update product on server. Changes may not persist.');
        }

        // Reset editing state
        setEditingProduct(null);
      } else {
        // Create a new product with ID
        const newProductWithId: Product = {
          ...values,
          id: 'prod-' + Date.now()
        };

        // Special handling for Laddu Gopal Mukut - clear inch-based pricing
        if (newProductWithId.productCategory === 'Laddu Gopal Mukut') {
          newProductWithId.costPricePerInch = undefined;
          newProductWithId.ratePerInch = undefined;
        }

        // First save to the server
        try {
          // Transform product data to match server expectations
          const serverProduct = {
            sku: newProductWithId.sku,
            name: newProductWithId.name,
            category: newProductWithId.productCategory, // Map productCategory to category
            description: newProductWithId.name, // Use name as description
            quantity: newProductWithId.quantity,
            price: newProductWithId.ratePerPiece || 0, // Use ratePerPiece as price
            productType: newProductWithId.productType || 'Traded',
            costPricePerPiece: newProductWithId.costPricePerPiece ?? null,
            ratePerPiece: newProductWithId.ratePerPiece ?? null,
            costPricePerInch: newProductWithId.costPricePerInch ?? null,
            ratePerInch: newProductWithId.ratePerInch ?? null
          };

          // Log the data being sent to server
          console.log('Sending to server:', JSON.stringify(serverProduct, null, 2));

          const response = await axios.post('/inventory', serverProduct, { withCredentials: true });

          // Update the product with the server-generated ID
          const savedProduct = {
            ...newProductWithId,
            id: response.data.id || newProductWithId.id
          };

          // Add the new product to the list with server ID
          const updatedProducts = [...products, savedProduct];
          setProducts(updatedProducts);
          message.success('Product added successfully!');
        } catch (error) {
          console.error('Failed to save product to server:', error);
          message.error('Failed to save product to server. Please try again.');
          // Don't add to local state if server save failed
          return;
        }
      }

      // Reset form
      form.resetFields();
      setShowAddForm(false);
    } catch (err) {
      setError('Failed to add product');
      console.error(err);
    }
  };

  // Function to download Excel template
  const downloadTemplate = () => {
    // Create a workbook with a worksheet
    const wb = XLSX.utils.book_new();
    
    // Create template data with headers and sample rows
    const templateData = [
      // Headers
      [
        'Product Type', 
        'SKU', 
        'Product Name', 
        'Product Category',
        'Quantity', 
        'Cost Price per Piece', 
        'Rate per Piece', 
        'Cost Price per Inch', 
        'Rate per Inch'
      ],
      // Sample data - Mata Rani Base
      [
        'Manufactured',
        'MRB-001',
        'Mata Rani Base Red',
        'Mata Rani Base',
        '10',
        '500',
        '650',
        '',
        ''
      ],
      // Sample data - Laddu Gopal Base
      [
        'Manufactured',
        'LGB-001',
        'Laddu Gopal Base Yellow',
        'Laddu Gopal Base',
        '15',
        '',
        '',
        '25',
        '35'
      ],
      // Sample data - Laddu Gopal Mukut
      [
        'Manufactured',
        'LGM-001',
        'Laddu Gopal Mukut Golden',
        'Laddu Gopal Mukut',
        '8',
        '350',
        '450',
        '',
        ''
      ],
      // Sample data - Traded item
      [
        'Traded',
        'TRD-001',
        'Decorative Item',
        'Others',
        '20',
        '150',
        '200',
        '',
        ''
      ]
    ];
    
    // Create worksheet from template data
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 15 }, // Product Type
      { wch: 12 }, // SKU
      { wch: 25 }, // Product Name
      { wch: 20 }, // Product Category
      { wch: 10 }, // Quantity
      { wch: 18 }, // Cost Price per Piece
      { wch: 15 }, // Rate per Piece
      { wch: 18 }, // Cost Price per Inch
      { wch: 15 }  // Rate per Inch
    ];
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Product Template");
    
    // Add a second sheet with instructions
    const instructionsData = [
      ['Product Import Instructions'],
      [''],
      ['1. Fill in the product details in the "Product Template" sheet'],
      ['2. Do not modify the column headers'],
      ['3. All fields are required except for prices (use 0 if not applicable)'],
      ['4. For Manufactured products:'],
      ['   - Mata Rani Base, Laddu Gopal Base: Use Cost/Rate per Inch'],
      ['   - Laddu Gopal Mukut: Use Cost/Rate per Piece'],
      ['   - Other categories: Use either pricing model'],
      ['5. For Traded products: Use Cost/Rate per Piece'],
      ['6. Valid Product Categories:'],
      ['   - Mata Rani Base'],
      ['   - Laddu Gopal Base'],
      ['   - Laddu Gopal Mukut'],
      ['   - Laddu Gopal Accessories'],
      ['   - Ganesh Lakhsmi Base'],
      ['   - Booti'],
      ['   - Others'],
      ['   - Laces'],
      ['   - Fabric'],
      ['7. Save the file as Excel (.xlsx) format before importing']
    ];
    
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsWs['!cols'] = [{ wch: 50 }]; // Set column width for instructions
    XLSX.utils.book_append_sheet(wb, instructionsWs, "Instructions");
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, "product_import_template.xlsx");
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
        const category = (item["Product Category"] || item["category"])?.trim() || "";
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
          sku: item["SKU"] || item["sku"] || "",
          name: item["Product Name"] || item["name"] || "",
          productType: item["Product Type"] || item["productType"] || "Traded",
          productCategory: category,
          quantity: Number(item["Quantity"] || item["quantity"] || 0),
          costPricePerPiece:
            (item["Cost Price per Piece"] || item["costPricePerPiece"]) !== undefined && (item["Cost Price per Piece"] || item["costPricePerPiece"]) !== ""
              ? Number(item["Cost Price per Piece"] || item["costPricePerPiece"])
              : undefined,
          ratePerPiece:
            (item["Rate per Piece"] || item["ratePerPiece"]) !== undefined && (item["Rate per Piece"] || item["ratePerPiece"]) !== ""
              ? Number(item["Rate per Piece"] || item["ratePerPiece"])
              : undefined,
          costPricePerInch:
            (item["Cost Price per Inch"] || item["costPricePerInch"]) !== undefined && (item["Cost Price per Inch"] || item["costPricePerInch"]) !== ""
              ? Number(item["Cost Price per Inch"] || item["costPricePerInch"])
              : undefined,
          ratePerInch:
            (item["Rate per Inch"] || item["ratePerInch"]) !== undefined && (item["Rate per Inch"] || item["ratePerInch"]) !== ""
              ? Number(item["Rate per Inch"] || item["ratePerInch"])
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
              productType: product.productType || 'Traded',
              costPricePerPiece: product.costPricePerPiece ?? null,
              ratePerPiece: product.ratePerPiece ?? null,
              costPricePerInch: product.costPricePerInch ?? null,
              ratePerInch: product.ratePerInch ?? null
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

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingProduct(null);
    form.resetFields();
  }

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
      <ProductPageHeader
        onAddProduct={() => setShowAddForm(true)}
        onImport={() => fileInputRef.current?.click()}
        onDownloadTemplate={downloadTemplate}
        isImporting={importing}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
      />
      <ProductStats
        totalProducts={totalProducts}
        totalStock={totalStock}
        totalValue={totalValue}
      />

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        open={showAddForm}
        onCancel={handleCancelForm}
        footer={null}
        width={800}
        destroyOnClose
      >
        <ProductForm
          form={form}
          onFinish={handleFormSubmit}
          onCancel={handleCancelForm}
          isEditing={!!editingProduct}
          productCategories={productCategories}
        />
      </Modal>

      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <div className="mt-4">Loading products...</div>
        </div>
      ) : error ? (
        <Alert message="Error" description={error} type="error" showIcon />
      ) : (
        <Card className="animate-fade-in">
          {filteredProducts.length > 0 ? (
            <>
              <ProductTable
                products={filteredProducts}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
              <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                <Button type="link" danger onClick={handleDeleteAllProducts}>
                  Delete All Products
                </Button>
              </div>
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={searchTerm ? 'No products match your search' : 'No products found'}
            />
          )}
        </Card>
      )}
    </div>
  );
};

export default SimpleProductTab;