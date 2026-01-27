import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { localStorageService } from './services/localStorageService';
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
  Input,
  Tooltip,
} from 'antd';
import { ExclamationCircleOutlined, PlusOutlined, UploadOutlined, FileExcelOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import ProductTable from './components/ProductTable';
import ProductForm from './components/ProductForm';
import { Product } from '../types/product';

// Helper function to check if a product is a whitespace entry
const isWhitespaceEntry = (product: Product): boolean => {
  const trimmedName = (product.name || '').trim();
  const trimmedSku = (product.sku || '').trim();
  const trimmedCategory = (product.productCategory || '').trim();
  
  // A product is considered a whitespace entry if all key fields are empty or only whitespace
  return !trimmedName && !trimmedSku && !trimmedCategory;
};

// Helper function to remove whitespace entries from product list
const removeWhitespaceEntries = (productList: Product[]): Product[] => {
  const filtered = productList.filter(product => !isWhitespaceEntry(product));
  const removedCount = productList.length - filtered.length;
  if (removedCount > 0) {
    console.log(`Removed ${removedCount} whitespace entry/entries from product list`);
  }
  return filtered;
};

const SimpleProductTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [form] = Form.useForm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Append an inventory activity log to localStorage (increment/decrement tracking)
  const appendInventoryLog = (product: Product, previousQuantity: number, newQuantity: number, reason: string, action: string = 'adjustment') => {
    try {
      const logs = JSON.parse(localStorage.getItem('inventoryActivityLogs') || '[]');
      const prev = Number(previousQuantity || 0);
      const next = Number(newQuantity || 0);
      const delta = next - prev;
      if (delta === 0) return; // No change, no log
      const entry = {
        id: `${Date.now()}-${product.id}-${Math.random().toString(36).slice(2, 8)}`,
        itemId: product.id,
        itemName: product.name,
        action,
        previousQuantity: prev,
        newQuantity: next,
        delta,
        reason,
        timestamp: new Date().toISOString(),
        user: 'System',
      };
      logs.unshift(entry);
      localStorage.setItem('inventoryActivityLogs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to append inventory log', e);
    }
  };

  // Load products from localStorage on component mount
  useEffect(() => {
    const localProducts = JSON.parse(localStorage.getItem('erp_inventory') || '[]');
    console.log(`Loading ${localProducts.length} products from localStorage on component mount`);
    const cleanedProducts = removeWhitespaceEntries(localProducts);
    if (cleanedProducts.length !== localProducts.length) {
      localStorage.setItem('erp_inventory', JSON.stringify(cleanedProducts));
    }
    setProducts(cleanedProducts);
    setLoading(false);
  }, []);

  // Load products from localStorage only
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Load from localStorage
      const localProducts = JSON.parse(localStorage.getItem('erp_inventory') || '[]');
      console.log(`Loading ${localProducts.length} products from localStorage`);
      const cleanedProducts = removeWhitespaceEntries(localProducts);
      if (cleanedProducts.length !== localProducts.length) {
        localStorage.setItem('erp_inventory', JSON.stringify(cleanedProducts));
      }
      setProducts(cleanedProducts);
      setError(null);

      // If there's no data in erp_inventory, check if there's data in simpleInventoryProducts
      if (cleanedProducts.length === 0) {
        const hasFallbackData = localStorage.getItem('simpleInventoryProducts');
        if (hasFallbackData) {
          const fallbackData = JSON.parse(hasFallbackData);
          if (fallbackData.length > 0) {
            console.log('Using fallback data from simpleInventoryProducts:', fallbackData);
            const cleanedFallback = removeWhitespaceEntries(fallbackData);
            // Save to erp_inventory for future use
            localStorage.setItem('erp_inventory', JSON.stringify(cleanedFallback));
            setProducts(cleanedFallback);
            setError(null);
          }
        }
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error in fetchProducts:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Save products to localStorage whenever they change (with whitespace filtering)
  useEffect(() => {
    if (!loading) {
      const cleanedProducts = removeWhitespaceEntries(products);
      localStorage.setItem('erp_inventory', JSON.stringify(cleanedProducts));
    }
  }, [products, loading]);

  const handleDuplicateProduct = (product: Product) => {
    const newProduct = { ...product, id: Date.now().toString() };
    const productIndex = products.findIndex((p) => p.id === product.id);
    const newProducts = [...products];
    newProducts.splice(productIndex + 1, 0, newProduct);
    const cleanedProducts = removeWhitespaceEntries(newProducts);
    setProducts(cleanedProducts);
    localStorageService.set('erp_inventory', cleanedProducts);
    // Log stock creation for duplicated product (treat as new stock for the duplicate)
    const dupQty = Number(newProduct.quantity || 0);
    if (dupQty !== 0) {
      appendInventoryLog(newProduct as Product, 0, dupQty, 'Product duplicated', 'duplicate');
    }
    message.success('Product duplicated successfully');
  };

  const handleDeleteSelected = () => {
    Modal.confirm({
      title: `Delete ${selectedRowKeys.length} Products`,
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete the selected products? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        try {
          const toDelete = products.filter(p => selectedRowKeys.includes(p.id));
          toDelete.forEach(p => {
            const prevQty = Number(p.quantity || 0);
            if (prevQty !== 0) {
              appendInventoryLog(p, prevQty, 0, 'Bulk delete', 'delete');
            }
          });
          const updatedProducts = products.filter(p => !selectedRowKeys.includes(p.id));
          localStorage.setItem('erp_inventory', JSON.stringify(updatedProducts));
          setProducts(updatedProducts);
          setSelectedRowKeys([]);
          message.success(`${selectedRowKeys.length} products have been deleted.`);
        } catch (error) {
          message.error('Failed to delete selected products.');
          console.error('Error deleting selected products:', error);
        }
      },
    });
  };

  const handleDeleteAllProducts = () => {
    Modal.confirm({
      title: 'Delete All Products',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete all products? This action cannot be undone.',
      okText: 'Delete All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        try {
          // Log deletion for each product with non-zero stock
          products.forEach(p => {
            const prevQty = Number(p.quantity || 0);
            if (prevQty !== 0) {
              appendInventoryLog(p, prevQty, 0, 'Delete all products', 'delete');
            }
          });
          localStorage.setItem('erp_inventory', JSON.stringify([]));
          setProducts([]);
          setSelectedRowKeys([]);
          message.success('All products have been deleted.');
        } catch (error) {
          message.error('Failed to delete all products.');
          console.error('Error deleting all products:', error);
        }
      },
    });
  };

  const handleDownloadSelected = () => {
    if (selectedRowKeys.length === 0) {
      message.warn('No products selected for download.');
      return;
    }

    const selectedProducts = products.filter(p => selectedRowKeys.includes(p.id));

    const dataToExport = selectedProducts.map(p => ({
      'Product Type': p.productType,
      'SKU': p.sku,
      'Product Name': p.name,
      'Product Category': p.productCategory,
      'Size': p.size,
      'Quantity': p.quantity,
      'Cost Price per Piece': p.costPricePerPiece,
      'Rate per Piece': p.ratePerPiece,
      'Cost Price per Inch': p.costPricePerInch,
      'Rate per Inch': p.ratePerInch,
    }));
    
    const csv = Papa.unparse(dataToExport);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'selected_products.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success(`${selectedProducts.length} products downloaded successfully.`);
  };

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
    setEditingProduct(product);
    form.setFieldsValue({
      sku: product.sku,
      name: product.name,
      productType: product.productType,
      productCategory: product.productCategory,
      size: product.size,
      quantity: product.quantity,
      costPricePerPiece: product.costPricePerPiece,
      ratePerPiece: product.ratePerPiece,
      costPricePerInch: product.costPricePerInch,
      ratePerInch: product.ratePerInch,
    });
    setIsModalVisible(true);
  };

  const handleDeleteProduct = (product: Product) => {
    Modal.confirm({
      title: 'Delete Product',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${product.name}"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        const prevQty = Number(product.quantity || 0);
        if (prevQty !== 0) {
          appendInventoryLog(product, prevQty, 0, 'Product deleted', 'delete');
        }
        const currentProducts = JSON.parse(localStorage.getItem('erp_inventory') || '[]');
        const updatedProducts = currentProducts.filter((p: any) => p.id !== product.id);
        localStorage.setItem('erp_inventory', JSON.stringify(updatedProducts));
        setProducts(updatedProducts);
        window.dispatchEvent(new CustomEvent('inventory:updated', { detail: updatedProducts }));
        message.success('Product deleted successfully');
      },
    });
  };

  const handleFormSubmit = async (values: any) => {
    if (!values.sku || !values.name || !values.productCategory) {
      message.error('SKU, Name, and Product Category are required');
      return;
    }

    try {
      const currentProducts = JSON.parse(localStorage.getItem('erp_inventory') || '[]');

      if (editingProduct) {
        const prevQty = Number(editingProduct.quantity || 0);
        const newQty = Number((values.quantity ?? prevQty) || 0);
        if (prevQty !== newQty) {
          appendInventoryLog(editingProduct, prevQty, newQty, 'Manual update via product form', 'adjustment');
        }
        const updatedProduct = {
          ...values,
          id: editingProduct.id,
          sku: values.sku,
          productCategory: values.productCategory,
          size: values.size,
          quantity: values.quantity,
          updatedAt: new Date().toISOString()
        };

        const updatedProducts = currentProducts.map((p: any) =>
          p.id === editingProduct.id ? updatedProduct : p
        );
        const cleanedProducts = removeWhitespaceEntries(updatedProducts);
        localStorage.setItem('erp_inventory', JSON.stringify(cleanedProducts));
        setProducts(cleanedProducts);
        window.dispatchEvent(new CustomEvent('inventory:updated', { detail: cleanedProducts }));
        message.success('Product updated successfully');
      } else {
        const newProduct = {
          ...values,
          id: Date.now().toString(),
          sku: values.sku,
          productCategory: values.productCategory,
          size: values.size,
          quantity: values.quantity,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const initQty = Number(newProduct.quantity || 0);
        if (initQty !== 0) {
          appendInventoryLog(newProduct as Product, 0, initQty, 'Product created', 'create');
        }
        console.log("DEBUG: All parameters of newly saved product:", JSON.stringify(newProduct, null, 2));

        const updatedProducts = [...currentProducts, newProduct];
        const cleanedProducts = removeWhitespaceEntries(updatedProducts);
        localStorage.setItem('erp_inventory', JSON.stringify(cleanedProducts));
        setProducts(cleanedProducts);
        window.dispatchEvent(new CustomEvent('inventory:updated', { detail: cleanedProducts }));
        message.success('Product added successfully');
      }

      setIsModalVisible(false);
      setEditingProduct(null);
      form.resetFields();
    } catch (error) {
      message.error('Failed to save product');
      console.error(error);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    const processData = (data: any[]) => {
      try {
        const importedProducts = data.map((row: any) => ({
          id: Date.now().toString() + Math.random(),
          productType: row['Product Type'] || 'Traded',
          sku: row.SKU || '',
          name: row['Product Name'] || '',
          productCategory: (row['Product Category'] || '').toUpperCase(),
          size: row.Size || '',
          quantity: Number(row.Quantity) || 0,
          unit: row.Unit || '',
          costPricePerPiece: Number(row['Cost Price per Piece']) || 0,
          ratePerPiece: Number(row['Rate per Piece']) || 0,
          costPricePerInch: Number(row['Cost Price per Inch']) || 0,
          ratePerInch: Number(row['Rate per Inch']) || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        const currentProducts = JSON.parse(localStorage.getItem('erp_inventory') || '[]');
        const cleanedImported = removeWhitespaceEntries(importedProducts);
        const updatedProducts = removeWhitespaceEntries([...currentProducts, ...cleanedImported]);
        localStorage.setItem('erp_inventory', JSON.stringify(updatedProducts));
        setProducts(updatedProducts);

        // Log increments for each imported product with non-zero quantity
        cleanedImported.forEach((p: any) => {
          const qty = Number(p.quantity || 0);
          if (qty !== 0) {
            appendInventoryLog(p as Product, 0, qty, 'Imported', 'import');
          }
        });

        const removedCount = importedProducts.length - cleanedImported.length;
        if (removedCount > 0) {
          message.success(`Successfully imported ${cleanedImported.length} products (${removedCount} whitespace entries removed)`);
        } else {
          message.success(`Successfully imported ${cleanedImported.length} products`);
        }
      } catch (error) {
        message.error('Failed to process imported products');
        console.error('Error in processData:', error);
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        complete: (results) => processData(results.data),
        error: (error) => {
          message.error('Failed to parse CSV file');
          console.error('CSV parsing error:', error);
          setImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          processData(jsonData);
        } catch (error) {
          message.error('Failed to parse Excel file');
          console.error('XLSX parsing error:', error);
          setImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.onerror = (error) => {
        message.error('Failed to read file');
        console.error('File reader error:', error);
        setImporting(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      message.error('Unsupported file type. Please upload a .csv or .xlsx file.');
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };
  
  const handleSelectionChange = (keys: React.Key[]) => {
    setSelectedRowKeys(keys);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ margin: '20px 0' }}
        />
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '24px' }}>
      <div style={{ background: '#fff', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: 'rgba(0, 0, 0, 0.85)' }}>Product Management</h2>
            <p style={{ margin: 0, color: 'rgba(0,0,0,.45)' }}>Manage your product inventory</p>
          </div>
          <Space key="actions">
            <Button type="primary" onClick={handleAddProduct} icon={<PlusOutlined />}>Add Product</Button>
            <Tooltip title="Download Excel template for importing products">
              <a href="/inventory_template.xlsx" download="inventory_template.xlsx">
                <Button icon={<FileExcelOutlined />}>Template</Button>
              </a>
            </Tooltip>
            <Tooltip title="Import products from Excel or CSV file">
              <Button onClick={() => fileInputRef.current?.click()} loading={importing} icon={<UploadOutlined />}>
                {importing ? 'Importing...' : 'Import'}
              </Button>
            </Tooltip>
          </Space>
        </div>
        <Input
          placeholder="Search by SKU, Name, or Category..."
          prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
      
      <div>
        {selectedRowKeys.length > 0 && (
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500 }}>{selectedRowKeys.length} items selected</span>
            <Space>
              <Button type="primary" onClick={handleDownloadSelected} icon={<FileExcelOutlined />}>
                Download Selected
              </Button>
              <Button type="primary" danger onClick={handleDeleteSelected} icon={<DeleteOutlined />}>
                Delete Selected
              </Button>
              <Button danger onClick={handleDeleteAllProducts} icon={<DeleteOutlined />}>
                Delete All
              </Button>
            </Space>
          </div>
        )}
        <Card>
          {products.length === 0 ? (
            <Empty
              description="No products found. Click 'Add Product' or 'Import' to get started."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <ProductTable
              products={filteredProducts}
              categories={productCategories}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onDuplicate={handleDuplicateProduct}
              onSelectionChange={handleSelectionChange}
            />
          )}
        </Card>
      </div>

      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingProduct(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <ProductForm
          form={form}
          onFinish={handleFormSubmit}
          productTypes={productCategories || []}
          isEditing={!!editingProduct}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingProduct(null);
            form.resetFields();
          }}
        />
      </Modal>
    </div>
  );
};

export default SimpleProductTab;