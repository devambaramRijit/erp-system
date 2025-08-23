import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, decimal, integer, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuid } from "drizzle-orm/pg-core";
// Users table with roles
export const User = pgTable("User", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    role: text("role").notNull().default("employee"), // employee, manager, admin
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Inventory items
export const inventoryItems = pgTable("inventory_items", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    name: text("name").notNull(),
    description: text("description"),
    sku: text("sku").notNull().unique(),
    category: text("category").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    stock: integer("stock").notNull().default(0),
    minStock: integer("min_stock").notNull().default(0),
    status: text("status").notNull().default("active"), // active, inactive, discontinued
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Sales orders
export const salesOrders = pgTable("sales_orders", {
    id: uuid("id").primaryKey().defaultRandom().notNull(),
    orderNumber: text("order_number").notNull().unique(),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    items: json("items").notNull(), // Array of {itemId, quantity, price}
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
    status: text("status").notNull().default("pending"), // pending, completed, cancelled
    orderDate: timestamp("order_date").notNull().defaultNow(),
    createdBy: uuid("created_by").notNull().references(() => User.id), // FK
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
export const insertSalesOrderSchema = createInsertSchema(salesOrders).omit({
    id: true,
    updatedAt: true,
});
// Expenses
export const expenses = pgTable("expenses", {
    id: uuid("id").primaryKey().default(sql `gen_random_uuid()`),
    title: text("title").notNull(),
    description: text("description"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    category: text("category").notNull(),
    expenseDate: timestamp("expense_date").notNull(),
    status: text("status").notNull().default("pending"), // pending, approved, rejected
    submittedBy: uuid("submitted_by").notNull(),
    approvedBy: uuid("approved_by"),
    receiptUrl: text("receipt_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Audit logs
export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().default(sql `gen_random_uuid()`),
    userId: uuid("user_id").notNull(),
    action: text("action").notNull(), // CREATE, UPDATE, DELETE, VIEW
    resource: text("resource").notNull(), // table/entity name
    resourceId: text("resource_id").notNull(),
    details: text("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
});
export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertUserSchema = createInsertSchema(User).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertExpenseSchema = createInsertSchema(expenses).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
    id: true,
    timestamp: true,
});
// Role enum for validation
export const userRoles = ["employee", "manager", "admin"];
//# sourceMappingURL=schema.js.map