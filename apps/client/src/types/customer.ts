// types/customer.ts
export interface CustomerData {
  id: string;
  customerName: string;
  mobileNumber1: string;
  mobileNumber2?: string;
  houseNumber?: string;
  city?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  source: string;
  notes?: string;
  landmark?: string;
}

export interface FormData extends Omit<CustomerData, 'id'> {}

export interface CustomerUpdateEvent {
  customers: CustomerData[];
  action: 'add' | 'update' | 'delete' | 'import';
}
