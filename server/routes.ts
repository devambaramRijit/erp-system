import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertInventoryItemSchema,
  insertSalesOrderSchema,
  insertExpenseSchema,
  insertUserSchema
} from "@shared/schema";
import { z } from "zod";

// Middleware to create audit logs
const createAuditLog = async (req: Request, action: string, resource: string, resourceId: string, details?: string) => {
  if (req.user) {
    await storage.createAuditLog({
      userId: req.user.id,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress || '',
      userAgent: req.get('User-Agent') || '',
    });
  }
};

// Middleware to check user role
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Inventory Routes
  app.get("/api/inventory", async (req: Request, res: Response) => {
    try {
      const items = await storage.getAllInventoryItems();
      await createAuditLog(req, "VIEW", "inventory_items", "all", "Viewed inventory list");
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  app.post("/api/inventory", requireRole(["admin", "manager"]), async (req: Request, res: Response) => {
    try {
      const validatedData = insertInventoryItemSchema.parse(req.body);
      
      // Check if SKU already exists
      const existingItem = await storage.getInventoryItemBySku(validatedData.sku);
      if (existingItem) {
        return res.status(400).json({ message: "SKU already exists" });
      }
      
      const item = await storage.createInventoryItem(validatedData);
      await createAuditLog(req, "CREATE", "inventory_items", item.id, `Created inventory item: ${item.name}`);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.put("/api/inventory/:id", requireRole(["admin", "manager"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const item = await storage.updateInventoryItem(id, updates);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      await createAuditLog(req, "UPDATE", "inventory_items", id, `Updated inventory item: ${item.name}`);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", requireRole(["admin", "manager"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const item = await storage.getInventoryItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      const deleted = await storage.deleteInventoryItem(id);
      if (deleted) {
        await createAuditLog(req, "DELETE", "inventory_items", id, `Deleted inventory item: ${item.name}`);
        res.json({ message: "Inventory item deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete inventory item" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Sales Orders Routes
  app.get("/api/sales", async (req: Request, res: Response) => {
    try {
      const orders = await storage.getAllSalesOrders();
      await createAuditLog(req, "VIEW", "sales_orders", "all", "Viewed sales orders list");
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales orders" });
    }
  });

  app.post("/api/sales", requireRole(["admin", "manager", "employee"]), async (req: Request, res: Response) => {
    try {
      const validatedData = insertSalesOrderSchema.parse({
        ...req.body,
        createdBy: req.user?.id
      });
      
      const order = await storage.createSalesOrder(validatedData);
      await createAuditLog(req, "CREATE", "sales_orders", order.id, `Created sales order: ${order.orderNumber}`);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create sales order" });
    }
  });

  app.put("/api/sales/:id", requireRole(["admin", "manager"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const order = await storage.updateSalesOrder(id, updates);
      if (!order) {
        return res.status(404).json({ message: "Sales order not found" });
      }
      
      await createAuditLog(req, "UPDATE", "sales_orders", id, `Updated sales order: ${order.orderNumber}`);
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sales order" });
    }
  });

  // Expenses Routes
  app.get("/api/expenses", async (req: Request, res: Response) => {
    try {
      const expenses = await storage.getAllExpenses();
      await createAuditLog(req, "VIEW", "expenses", "all", "Viewed expenses list");
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", requireRole(["admin", "manager", "employee"]), async (req: Request, res: Response) => {
    try {
      const validatedData = insertExpenseSchema.parse({
        ...req.body,
        submittedBy: req.user?.id
      });
      
      const expense = await storage.createExpense(validatedData);
      await createAuditLog(req, "CREATE", "expenses", expense.id, `Created expense: ${expense.title}`);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", requireRole(["admin", "manager"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const expense = await storage.updateExpense(id, updates);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      await createAuditLog(req, "UPDATE", "expenses", id, `Updated expense: ${expense.title}`);
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  // Employee/User Routes
  app.get("/api/employees", requireRole(["admin", "manager"]), async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      await createAuditLog(req, "VIEW", "users", "all", "Viewed employees list");
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(validatedData.username) || 
                          await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Username or email already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      const { password, ...safeUser } = user;
      await createAuditLog(req, "CREATE", "users", user.id, `Created employee: ${user.firstName} ${user.lastName}`);
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      delete updates.password; // Don't allow password updates through this endpoint
      
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const { password, ...safeUser } = user;
      await createAuditLog(req, "UPDATE", "users", id, `Updated employee: ${user.firstName} ${user.lastName}`);
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Audit Logs Routes
  app.get("/api/audit-logs", requireRole(["admin"]), async (req: Request, res: Response) => {
    try {
      const logs = await storage.getAllAuditLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    try {
      const [inventoryItems, salesOrders, expenses, users] = await Promise.all([
        storage.getAllInventoryItems(),
        storage.getAllSalesOrders(),
        storage.getAllExpenses(),
        storage.getAllUsers()
      ]);

      const stats = {
        totalRevenue: salesOrders
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0),
        totalOrders: salesOrders.length,
        completedOrders: salesOrders.filter(order => order.status === 'completed').length,
        pendingOrders: salesOrders.filter(order => order.status === 'pending').length,
        totalInventoryItems: inventoryItems.length,
        lowStockItems: inventoryItems.filter(item => item.stock <= item.minStock).length,
        totalEmployees: users.length,
        activeEmployees: users.filter(user => user.isActive).length,
        totalExpenses: expenses
          .filter(expense => expense.status === 'approved')
          .reduce((sum, expense) => sum + parseFloat(expense.amount), 0),
        pendingExpenses: expenses.filter(expense => expense.status === 'pending').length,
      };

      await createAuditLog(req, "VIEW", "dashboard", "stats", "Viewed dashboard statistics");
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
