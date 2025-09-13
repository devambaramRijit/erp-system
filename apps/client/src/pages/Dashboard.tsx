import React, { useState, useEffect } from "react";

interface DashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  invoiceType: 'manufactured';
  items: any[];
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  advancePayment: number;
  shippingCharges: number;
  packingCharges: number;
  total: number;
  notes?: string;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [todaySales, setTodaySales] = useState(0);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: "1",
      sku: "ITEM001",
      name: "Laptop Computer",
      description: "High-performance laptop for business use",
      quantity: 15,
      price: 999.99,
      category: "Electronics",
    },
    {
      id: "2",
      sku: "ITEM002",
      name: "Office Chair",
      description: "Ergonomic office chair with lumbar support",
      quantity: 32,
      price: 249.99,
      category: "Furniture",
    },
    {
      id: "3",
      sku: "ITEM003",
      name: "Wireless Mouse",
      description: "Bluetooth wireless mouse with precision tracking",
      quantity: 75,
      price: 29.99,
      category: "Electronics",
    },
    {
      id: "4",
      sku: "ITEM004",
      name: "Desk Lamp",
      description: "LED desk lamp with adjustable brightness",
      quantity: 24,
      price: 49.99,
      category: "Office Supplies",
    },
  ]);

  const [newItem, setNewItem] = useState({
    sku: "",
    name: "",
    description: "",
    quantity: 0,
    price: 0,
    category: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const totalValue = inventoryItems.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );
  const lowStockItems = inventoryItems.filter((i) => i.quantity < 10).length;

  const handleAddItem = () => {
    if (!newItem.sku || !newItem.name || !newItem.category) {
      alert("Please fill in all required fields");
      return;
    }
    const itemToAdd: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...newItem,
    };
    setInventoryItems((prev) => [...prev, itemToAdd]);
    setNewItem({
      sku: "",
      name: "",
      description: "",
      quantity: 0,
      price: 0,
      category: "",
    });
    setShowAddForm(false);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setInventoryItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  useEffect(() => {
    // Load invoices from localStorage
    const savedInvoices = localStorage.getItem('invoices');
    if (savedInvoices) {
      const parsedInvoices = JSON.parse(savedInvoices);
      setInvoices(parsedInvoices);
      
      // Calculate today's sales
      const today = new Date().toDateString();
      const todayInvoices = parsedInvoices.filter((invoice: Invoice) => {
        const invoiceDate = new Date(invoice.date).toDateString();
        return invoiceDate === today;
      });
      
      const totalTodaySales = todayInvoices.reduce((sum: number, invoice: Invoice) => {
        // Calculate total without advance payment
        const subtotal = invoice.items.reduce((itemSum: number, item: any) => {
          if (item.productCategory === 'Laddu Gopal Base') {
            return itemSum + item.total;
          } else {
            return itemSum + ((item.rate || 0) * (item.quantity || 0));
          }
        }, 0);
        
        const discountAmount = invoice.discountType === 'percentage'
          ? (subtotal * (invoice.discountRate || 0)) / 100
          : (invoice.discountRate || 0);
          
        const subtotalAfterDiscount = subtotal - discountAmount;
        const total = subtotalAfterDiscount + (invoice.shippingCharges || 0) + (invoice.packingCharges || 0);
        
        return sum + total;
      }, 0);
      
      setTodaySales(totalTodaySales);
    }
  }, []);

  /** Dashboard overview */
  const DashboardView = () => (
    <div>
      <h2>Dashboard Overview</h2>
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <h3>Total Items</h3>
          <p>{inventoryItems.length}</p>
        </div>
        <div className="stat-card stat-orange">
          <h3>Total Value</h3>
          <p>₹{totalValue.toFixed(2)}</p>
        </div>
        <div className="stat-card stat-green">
          <h3>Today's Sales</h3>
          <p>₹{todaySales.toFixed(2)}</p>
        </div>
        <div className="stat-card stat-red">
          <h3>Low Stock Items</h3>
          <p>{lowStockItems}</p>
        </div>
      </div>

      <div>
        <h3>Recent Inventory Items</h3>
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {inventoryItems.slice(0, 5).map((item) => (
              <tr key={item.id}>
                <td>{item.sku}</td>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>{item.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /** Inventory management view */
  const InventoryView = () => (
    <div>
      <div className="header-row">
        <h2>Inventory Management</h2>
        <button className="button button-primary" onClick={() => setShowAddForm(true)}>
          Add New Item
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <h3>Total Items</h3>
          <p>{inventoryItems.length}</p>
        </div>
        <div className="stat-card stat-orange">
          <h3>Total Value</h3>
          <p>₹{totalValue.toFixed(2)}</p>
        </div>
        <div className="stat-card stat-green">
          <h3>Today's Sales</h3>
          <p>₹{todaySales.toFixed(2)}</p>
        </div>
        <div className="stat-card stat-red">
          <h3>Low Stock Items</h3>
          <p>{lowStockItems}</p>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Name</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventoryItems.map((item) => (
            <tr key={item.id}>
              <td>{item.sku}</td>
              <td>{item.name}</td>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>${item.price.toFixed(2)}</td>
              <td>{item.category}</td>
              <td>
                <button
                  className="button button-destructive"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add New Item</h2>
            <div className="form-group">
              <label>SKU *</label>
              <input
                className="input"
                value={newItem.sku}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, sku: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label>Name *</label>
              <input
                className="input"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                className="input"
                value={newItem.description}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <input
                className="input"
                value={newItem.category}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, category: e.target.value }))
                }
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Quantity</label>
                <input
                  className="input"
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) =>
                    setNewItem((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="button button-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button className="button button-primary" onClick={handleAddItem}>
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="header-row">
        <div>
          <h1>ErpSoul ERP System</h1>
          <p className="text-muted-foreground">Welcome, {user.name}</p>
        </div>
        <button className="button button-destructive" onClick={onLogout}>
          Logout
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`tab ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory Management
        </button>
      </div>

      {activeTab === "dashboard" && <DashboardView />}
      {activeTab === "inventory" && <InventoryView />}
    </div>
  );
}
