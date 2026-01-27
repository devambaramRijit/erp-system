export interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
  productCategory?: string;
  ratePerInch?: number;
  size?: number;
  cpPerPc?: number;
  rate?: number;
  pricePerInch?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  invoiceType: 'manufactured';
  items: InvoiceItem[];
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  advancePayment: number;
  shippingCharges: number;
  packingCharges: number;
  total: number;
  notes?: string;
  notesLine1?: string;
  notesLine2?: string;
  notesLine3?: string;
  isFinalized?: boolean;
  discountType?: 'percentage' | 'decimal';
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}
