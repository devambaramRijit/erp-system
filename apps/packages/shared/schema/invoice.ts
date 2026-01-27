import { z } from 'zod';

export const invoiceItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
  total: z.number(),
});

export const invoiceSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  items: z.array(invoiceItemSchema),
  total: z.number(),
  isFinalized: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  // Add other fields as needed from the router
  discountType: z.string().optional(),
  discountRate: z.number().optional(),
  shippingCharges: z.number().optional(),
  packingCharges: z.number().optional(),
  advancePayment: z.number().optional(),
  subtotal: z.number().optional(),
  discountAmount: z.number().optional(),
});

export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
