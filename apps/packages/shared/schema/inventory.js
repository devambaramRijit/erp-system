"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryUpdateSchema = exports.inventoryCreateSchema = exports.inventoryItemSchema = exports.categorySchema = exports.priceSchema = exports.quantitySchema = exports.descriptionSchema = exports.nameSchema = exports.skuSchema = exports.inventoryIdSchema = void 0;
const zod_1 = require("zod");
/**
 * Shared Inventory schemas for validation and typing across client and server
 */
exports.inventoryIdSchema = zod_1.z.string().uuid({ message: "Invalid inventory id" });
exports.skuSchema = zod_1.z
    .string()
    .trim()
    .min(3, { message: "SKU must be at least 3 characters" })
    .max(64, { message: "SKU is too long" });
exports.nameSchema = zod_1.z
    .string()
    .trim()
    .min(1, { message: "Name cannot be empty" })
    .max(200, { message: "Name is too long" });
exports.descriptionSchema = zod_1.z
    .string()
    .trim()
    .max(2000, { message: "Description is too long" })
    .optional()
    .or(zod_1.z.literal("").transform(() => undefined));
exports.quantitySchema = zod_1.z
    .number()
    .int({ message: "Quantity must be an integer" })
    .min(0, { message: "Quantity cannot be negative" });
exports.priceSchema = zod_1.z
    .number()
    .nonnegative({ message: "Price cannot be negative" })
    .refine((v) => Number.isFinite(v), { message: "Price must be a finite number" });
exports.categorySchema = zod_1.z
    .string()
    .trim()
    .max(120, { message: "Category is too long" })
    .optional()
    .or(zod_1.z.literal("").transform(() => undefined));
const dateLike = zod_1.z.union([zod_1.z.date(), zod_1.z.string()]);
exports.inventoryItemSchema = zod_1.z.object({
    id: exports.inventoryIdSchema,
    sku: exports.skuSchema,
    name: exports.nameSchema,
    description: exports.descriptionSchema.optional(),
    quantity: exports.quantitySchema,
    price: exports.priceSchema,
    category: exports.categorySchema.optional(),
    createdAt: dateLike,
    updatedAt: dateLike,
});
exports.inventoryCreateSchema = zod_1.z.object({
    sku: exports.skuSchema,
    name: exports.nameSchema,
    description: exports.descriptionSchema,
    quantity: exports.quantitySchema.default(0),
    price: exports.priceSchema,
    category: exports.categorySchema,
});
exports.inventoryUpdateSchema = zod_1.z
    .object({
    sku: exports.skuSchema.optional(),
    name: exports.nameSchema.optional(),
    description: exports.descriptionSchema,
    quantity: exports.quantitySchema.optional(),
    price: exports.priceSchema.optional(),
    category: exports.categorySchema,
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
    path: ["_"],
});
