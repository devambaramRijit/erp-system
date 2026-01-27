"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceSchema = exports.invoiceItemSchema = void 0;
const zod_1 = require("zod");
exports.invoiceItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    quantity: zod_1.z.number(),
    price: zod_1.z.number(),
    total: zod_1.z.number(),
});
exports.invoiceSchema = zod_1.z.object({
    id: zod_1.z.string(),
    customerName: zod_1.z.string(),
    items: zod_1.z.array(exports.invoiceItemSchema),
    total: zod_1.z.number(),
    isFinalized: zod_1.z.boolean().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
    // Add other fields as needed from the router
    discountType: zod_1.z.string().optional(),
    discountRate: zod_1.z.number().optional(),
    shippingCharges: zod_1.z.number().optional(),
    packingCharges: zod_1.z.number().optional(),
    advancePayment: zod_1.z.number().optional(),
    subtotal: zod_1.z.number().optional(),
    discountAmount: zod_1.z.number().optional(),
});
