import { 
  type User, 
  type InsertUser, 
  type InventoryItem, 
  type InsertInventoryItem,
  type SalesOrder,
  type InsertSalesOrder,
  type Expense,
  type InsertExpense,
  type AuditLog,
  type InsertAuditLog
} from "../shared/schema.js";
import { randomUUID } from "crypto";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser, transactionId?: string): Promise<User>;
  updateUser(id: string, updates: Partial<User>, transactionId?: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Inventory Items
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  getAllInventoryItems(page?: number, pageSize?: number): Promise<{ items: InventoryItem[], total: number }>;
  createInventoryItem(item: InsertInventoryItem, transactionId?: string): Promise<InventoryItem>;
  updateInventoryItem(id: string, updates: Partial<InventoryItem>, transactionId?: string): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string, transactionId?: string): Promise<boolean>;
  getInventoryItemBySku(sku: string): Promise<InventoryItem | undefined>;

  // Sales Orders
  getSalesOrder(id: string): Promise<SalesOrder | undefined>;
  getAllSalesOrders(page?: number, pageSize?: number): Promise<{ items: SalesOrder[], total: number }>;
  createSalesOrder(order: InsertSalesOrder, transactionId?: string): Promise<SalesOrder>;
  updateSalesOrder(id: string, updates: Partial<SalesOrder>, transactionId?: string): Promise<SalesOrder | undefined>;
  deleteSalesOrder(id: string, transactionId?: string): Promise<boolean>;

  // Expenses
  getExpense(id: string): Promise<Expense | undefined>;
  getAllExpenses(page?: number, pageSize?: number): Promise<{ items: Expense[], total: number }>;
  createExpense(expense: InsertExpense, transactionId?: string): Promise<Expense>;
  updateExpense(id: string, updates: Partial<Expense>, transactionId?: string): Promise<Expense | undefined>;
  deleteExpense(id: string, transactionId?: string): Promise<boolean>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog, transactionId?: string): Promise<AuditLog>;
  getAllAuditLogs(page?: number, pageSize?: number): Promise<{ items: AuditLog[], total: number }>;
  getAuditLogsByUser(userId: string, page?: number, pageSize?: number): Promise<{ items: AuditLog[], total: number }>;

  // Transactions
  beginTransaction(): string;
  commitTransaction(transactionId: string): Promise<void>;
  rollbackTransaction(transactionId: string): void;

  sessionStore: session.Store;
}

class StorageError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "StorageError";
    this.code = code;
  }
}


class Transaction {
  private operations: Array<() => Promise<any>> = [];
  private completed = false;

    async execute(): Promise<void> {
    if (this.completed) {
      throw new StorageError("Transaction already completed", "TRANSACTION_COMPLETE");
    }

    try {
      for (const operation of this.operations) {
        await operation();
      }
      this.completed = true;
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(`Transaction failed: ${error.message}`, "TRANSACTION_FAILED");
      }
      throw new StorageError("Transaction failed with unknown error", "TRANSACTION_FAILED");
    }
  }


  addOperation(operation: () => Promise<any>): void {
    if (this.completed) {
      throw new StorageError("Cannot add operation to completed transaction", "TRANSACTION_COMPLETE");
    }
    this.operations.push(operation);
  }
}

class Validator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    return password.length >= 8;
  }

  static validateSKU(sku: string) {
       return /^[A-Za-z0-9-_]+$/.test(sku);
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private inventoryItems: Map<string, InventoryItem>;
  private salesOrders: Map<string, SalesOrder>;
  private expenses: Map<string, Expense>;
  private auditLogs: Map<string, AuditLog>;
  private orderCounter: number = 1;
  public sessionStore: session.Store;
  private transactions: Map<string, Transaction> = new Map();

  constructor() {
    this.users = new Map();
    this.inventoryItems = new Map();
    this.salesOrders = new Map();
    this.expenses = new Map();
    this.auditLogs = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers() {
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      email: "admin@company.com",
      password: "697b704ddb9d19fe4ae84a6755778c1c5585ec51baf70f77d8aeaadeaece8693d275ae69441489e8217182c269036d729ae9767d81102aecc198ffb4c023db2f.7fc5b3393d9d6400aac21080d1142e9a", // scrypt hashed "admin123"
      firstName: "John",
      lastName: "Admin",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
  }

  // Transaction methods
  beginTransaction(): string {
    const transactionId = randomUUID();
    const transaction = new Transaction();
    this.transactions.set(transactionId, transaction);
    return transactionId;
  }

  async commitTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
    }
    await transaction.execute();
    this.transactions.delete(transactionId);
  }

  rollbackTransaction(transactionId: string): void {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
    }
    this.transactions.delete(transactionId);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!Validator.validateEmail(email)) {
      throw new StorageError("Invalid email format", "INVALID_EMAIL");
    }
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser, transactionId?: string): Promise<User> {
    if (!Validator.validateEmail(insertUser.email)) {
      throw new StorageError("Invalid email format", "INVALID_EMAIL");
    }
    if (!Validator.validatePassword(insertUser.password)) {
      throw new StorageError("Password must be at least 8 characters", "INVALID_PASSWORD");
    }

    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      id,
      role: insertUser.role || "employee",
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const operation = async () => {
      this.users.set(id, user);
    };

    if (transactionId) {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
      }
      transaction.addOperation(operation);
      return user;
    }

    await operation();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>, transactionId?: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    if (updates.email && !Validator.validateEmail(updates.email)) {
      throw new StorageError("Invalid email format", "INVALID_EMAIL");
    }

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };

    const operation = async () => {
      this.users.set(id, updatedUser);
    };

    if (transactionId) {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
      }
      transaction.addOperation(operation);
      return updatedUser;
    }

    await operation();
    return updatedUser;
  }

  async getAllUsers(page: number = 1, pageSize: number = 10): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allUsers.slice(startIndex, endIndex);
  }

  // Inventory methods
  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async getAllInventoryItems(page: number = 1, pageSize: number = 10): Promise<{ items: InventoryItem[], total: number }> {
    const allItems = Array.from(this.inventoryItems.values());
    const total = allItems.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = allItems.slice(startIndex, endIndex);
    
    return { items, total };
  }

  async createInventoryItem(insertItem: InsertInventoryItem, transactionId?: string): Promise<InventoryItem> {
    if (!Validator.validateSKU(insertItem.sku)) {
      throw new StorageError("Invalid SKU format", "INVALID_SKU");
    }

    const id = randomUUID();
    const item: InventoryItem = { 
      ...insertItem,
      id,
      description: insertItem.description || null,
      status: insertItem.status || "active",
      stock: insertItem.stock || 0,
      minStock: insertItem.minStock || 0,
      imageUrl: insertItem.imageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const operation = async () => {
      this.inventoryItems.set(id, item);
    };

    if (transactionId) {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
      }
      transaction.addOperation(operation);
      return item;
    }

    await operation();
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>, transactionId?: string): Promise<InventoryItem | undefined> {
    const item = this.inventoryItems.get(id);
    if (!item) return undefined;

    if (updates.sku && !Validator.validateSKU(updates.sku)) {
      throw new StorageError("Invalid SKU format", "INVALID_SKU");
    }

    const updatedItem = { ...item, ...updates, updatedAt: new Date() };

    const operation = async () => {
      this.inventoryItems.set(id, updatedItem);
    };

    if (transactionId) {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
      }
      transaction.addOperation(operation);
      return updatedItem;
    }

    await operation();
    return updatedItem;
  }

async deleteInventoryItem(id: string, transactionId?: string): Promise<boolean> {
  const operation = async () => {
    return this.inventoryItems.delete(id);
  };

  if (transactionId) {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
    }
    transaction.addOperation(operation);
    return true;
  }

  return await operation();
}


  async getInventoryItemBySku(sku: string): Promise<InventoryItem | undefined> {
    if (!Validator.validateSKU(sku)) {
      throw new StorageError("Invalid SKU format", "INVALID_SKU");
    }
    return Array.from(this.inventoryItems.values()).find(item => item.sku === sku);
  }

  // Sales Orders methods
  async getSalesOrder(id: string): Promise<SalesOrder | undefined> {
    return this.salesOrders.get(id);
  }

  async getAllSalesOrders(page: number = 1, pageSize: number = 10): Promise<{ items: SalesOrder[], total: number }> {
    const allOrders = Array.from(this.salesOrders.values());
    const total = allOrders.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = allOrders.slice(startIndex, endIndex);
    
    return { items, total };
  }

  async createSalesOrder(insertOrder: InsertSalesOrder, transactionId?: string): Promise<SalesOrder> {
    const id = randomUUID();
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(this.orderCounter++).padStart(3, '0')}`;
    const order: SalesOrder = { 
      id,
      status:  "pending",
      orderDate: new Date(),
      updatedAt: new Date(),
      ...insertOrder,
    };

    const operation = async () => {
      this.salesOrders.set(id, order);
    };

    if (transactionId) {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
      }
      transaction.addOperation(operation);
      return order;
    }

    await operation();
    return order;
  }

  async updateSalesOrder(id: string, updates: Partial<SalesOrder>, transactionId?: string): Promise<SalesOrder | undefined> {
    const order = this.salesOrders.get(id);
    if (!order) return undefined;

    const updatedOrder = { ...order, ...updates, updatedAt: new Date() };

    const operation = async () => {
      this.salesOrders.set(id, updatedOrder);
    };

    if (transactionId) {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
      }
      transaction.addOperation(operation);
      return updatedOrder;
    }

    await operation();
    return updatedOrder;
  }

  async deleteSalesOrder(id: string, transactionId?: string): Promise<boolean> {
    const operation = async () => {
      return this.salesOrders.delete(id);
    };

    if (transactionId) {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
      }
      transaction.addOperation(operation);
      return true;
    }

    return await operation();
  }

  // Expenses methods
  async getExpense(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async getAllExpenses(page: number = 1, pageSize: number = 10): Promise<{ items: Expense[], total: number }> {
    const allExpenses = Array.from(this.expenses.values());
    const total = allExpenses.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = allExpenses.slice(startIndex, endIndex);
    
    return { items, total };
  }

  async createExpense(insertExpense: InsertExpense, transactionId?: string): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = { 
      ...insertExpense,
      id,
      description: insertExpense.description || null,
      status: insertExpense.status || "pending",
      approvedBy: insertExpense.approvedBy || null,
      receiptUrl: insertExpense.receiptUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const operation = async () => {
      this.expenses.set(id, expense);
    };

    if (transactionId) {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
      }
      transaction.addOperation(operation);
      return expense;
    }

    await operation();
    return expense;
  }

  async updateExpense(id: string, updates: Partial<Expense>, transactionId?: string): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;

    const updatedExpense = { ...expense, ...updates, updatedAt: new Date() };

    const operation = async () => {
      this.expenses.set(id, updatedExpense);
    };

    if (transactionId) {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
      }
      transaction.addOperation(operation);
      return updatedExpense;
    }

    await operation();
    return updatedExpense;
  }

  async deleteExpense(id: string, transactionId?: string): Promise<boolean> {
    const operation = async () => {
      return this.expenses.delete(id);
    };

    if (transactionId) {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
      }
      transaction.addOperation(operation);
      return true;
    }

    return await operation();
  }

  // Audit Logs methods
  async createAuditLog(insertLog: InsertAuditLog, transactionId?: string): Promise<AuditLog> {
    const id = randomUUID();
    const log: AuditLog = { 
      ...insertLog,
      id,
      details: insertLog.details || null,
      ipAddress: insertLog.ipAddress || null,
      userAgent: insertLog.userAgent || null,
      timestamp: new Date(),
    };

    const operation = async () => {
      this.auditLogs.set(id, log);
    };

    if (transactionId) {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new StorageError("Transaction not found", "TRANSACTION_NOT_FOUND");
      }
      transaction.addOperation(operation);
      return log;
    }

    await operation();
    return log;
  }

  async getAllAuditLogs(page: number = 1, pageSize: number = 10): Promise<{ items: AuditLog[], total: number }> {
    const allLogs = Array.from(this.auditLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const total = allLogs.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = allLogs.slice(startIndex, endIndex);
    
    return { items, total };
  }

  async getAuditLogsByUser(userId: string, page: number = 1, pageSize: number = 10): Promise<{ items: AuditLog[], total: number }> {
    const userLogs = Array.from(this.auditLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const total = userLogs.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = userLogs.slice(startIndex, endIndex);
    
    return { items, total };
  }
}

export const storage = new MemStorage();
