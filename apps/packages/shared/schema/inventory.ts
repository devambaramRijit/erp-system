import { z } from "zod";

/**
 * Shared Inventory schemas for validation and typing across client and server
 */

export const inventoryIdSchema = z.string().uuid({ message: "Invalid inventory id" });

export const skuSchema = z
  .string({ required_error: "SKU is required" })
  .trim()
  .min(3, { message: "SKU must be at least 3 characters" })
  .max(64, { message: "SKU is too long" });

export const nameSchema = z
  .string({ required_error: "Name is required" })
  .trim()
  .min(1, { message: "Name cannot be empty" })
  .max(200, { message: "Name is too long" });

export const descriptionSchema = z
  .string()
  .trim()
  .max(2000, { message: "Description is too long" })
  .optional()
  .or(z.literal("").transform(() => undefined));

export const quantitySchema = z
  .number({ required_error: "Quantity is required" })
  .int({ message: "Quantity must be an integer" })
  .min(0, { message: "Quantity cannot be negative" });

export const priceSchema = z
  .number({ required_error: "Price is required" })
  .nonnegative({ message: "Price cannot be negative" })
  .refine((v) => Number.isFinite(v), { message: "Price must be a finite number" });

export const categorySchema = z
  .string()
  .trim()
  .max(120, { message: "Category is too long" })
  .optional()
  .or(z.literal("").transform(() => undefined));

const dateLike = z.union([z.date(), z.string()]);

export const inventoryItemSchema = z.object({
  id: inventoryIdSchema,
  sku: skuSchema,
  name: nameSchema,
  description: descriptionSchema.optional(),
  quantity: quantitySchema,
  price: priceSchema,
  category: categorySchema.optional(),
  createdAt: dateLike,
  updatedAt: dateLike,
});

export const inventoryCreateSchema = z.object({
  sku: skuSchema,
  name: nameSchema,
  description: descriptionSchema,
  quantity: quantitySchema.default(0),
  price: priceSchema,
  category: categorySchema,
});

export const inventoryUpdateSchema = z
  .object({
    sku: skuSchema.optional(),
    name: nameSchema.optional(),
    description: descriptionSchema,
    quantity: quantitySchema.optional(),
    price: priceSchema.optional(),
    category: categorySchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
    path: ["_"],
  });

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type InventoryCreateInput = z.infer<typeof inventoryCreateSchema>;
export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;
