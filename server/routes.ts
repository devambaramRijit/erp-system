import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth.ts";
import { storage } from "./storage.ts";
import {
  insertInventoryItemSchema,
  insertSalesOrderSchema,
  insertExpenseSchema,
  insertUserSchema
} from "../shared/schema.ts";
import { z } from "zod";

// Extend Express Request to include `user`
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
  }
}

// Interfaces
interface AuditLogData {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: string;
  ipAddress: string;
  userAgent: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: z.ZodError["errors"];
}

// Response helper
const createResponse = <T>(
  res: Response,
  status: number,
  success: boolean,
  data?: T,
  message?: string,
  errors?: z.ZodError["errors"]
) => {
  const response: ApiResponse<T> = { success };
  if (data !== undefined) response.data = data;
  if (message) response.message = message;
  if (errors) response.errors = errors;
  res.status(status).json(response);
};

// Audit log helper
const createAuditLog = async (
  req: Request,
  action: string,
  resource: string,
  resourceId: string,
  details?: string
) => {
  if (!req.user) return;
  const auditData: AuditLogData = {
    userId: req.user.id,
    action,
    resource,
    resourceId,
    details,
    ipAddress: req.ip || req.connection.remoteAddress || "",
    userAgent: req.get("User-Agent") || "",
  };
  await storage.createAuditLog(auditData);
};

// Role middleware
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return createResponse(res, 401, false, undefined, "Authentication required");
    }
    if (!roles.includes(req.user.role)) {
      return createResponse(res, 403, false, undefined, "Insufficient permissions");
    }
    next();
  };
};

// Async wrapper
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

// Register routes
export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Inventory routes
  app.get(
    "/api/inventory",
    asyncHandler(async (req, res) => {
      const items = await storage.getAllInventoryItems();
      await createAuditLog(req, "VIEW", "inventory_items", "all", "Viewed inventory list");
      createResponse(res, 200, true, items);
    })
  );

  app.post(
    "/api/inventory",
    requireRole(["admin", "manager"]),
    asyncHandler(async (req, res) => {
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const existingItem = await storage.getInventoryItemBySku(validatedData.sku);
      if (existingItem) return createResponse(res, 400, false, undefined, "SKU already exists");
      const item = await storage.createInventoryItem(validatedData);
      await createAuditLog(req, "CREATE", "inventory_items", item.id, `Created item: ${item.name}`);
      createResponse(res, 201, true, item);
    })
  );

  // Sales orders, expenses, users, and audit logs follow similar structure
  // (You can copy the same pattern from above, always using asyncHandler and createAuditLog)

  const httpServer = createServer(app);
  return httpServer;
}
