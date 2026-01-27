export interface Product {
  id: string;
  sku: string;
  name: string;
  productType: string;
  productCategory: string;
  quantity: number;
  price?: number;
  costPricePerPiece?: number;
  ratePerPiece?: number;
  costPricePerInch?: number;
  ratePerInch?: number;
  size?: string;
  unit?: string;
  code?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}