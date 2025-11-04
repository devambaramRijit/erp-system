// services/customerService.ts
import axios from "axios";
import { load, save } from "../utils/storage";
import { dispatchCustomerUpdate } from "../utils/events";
import { CustomerData, FormData } from "../types/customer";

const CUSTOMERS_KEY = "customers";

export const fetchCustomers = async () => {
  try {
    const response = await axios.get('/api/customers', { withCredentials: true });
    const customerData = Array.isArray(response.data) ? response.data : [];
    save(CUSTOMERS_KEY, customerData);
    return customerData;
  } catch (backendErr) {
    console.error('Error fetching customers from backend:', backendErr);
    throw new Error(`Error fetching customers: ${backendErr.response?.data?.message || backendErr.message || 'Unknown error'}`);
  }
};

export const addCustomer = async (customerData: FormData): Promise<CustomerData> => {
  try {
    const response = await axios.post('/api/customers', customerData, { withCredentials: true });
    return response.data;
  } catch (err) {
    console.error('Error adding customer:', err);
    throw new Error(`Failed to add customer: ${err.response?.data?.message || err.message || 'Unknown error'}`);
  }
};

export const updateCustomer = async (id: string, customerData: FormData): Promise<CustomerData> => {
  try {
    const response = await axios.put(`/api/customers/${id}`, customerData, { withCredentials: true });
    return response.data;
  } catch (err) {
    console.error('Error updating customer:', err);
    throw new Error(`Failed to update customer: ${err.response?.data?.message || err.message || 'Unknown error'}`);
  }
};

export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    await axios.delete(`/api/customers/${id}`, { withCredentials: true });
  } catch (err) {
    console.error('Error deleting customer:', err);
    throw new Error(`Failed to delete customer: ${err.response?.data?.message || err.message || 'Unknown error'}`);
  }
};

export const importCustomers = async (file: File): Promise<{ success: boolean; message: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('/api/customers/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });

    return response.data;
  } catch (err) {
    console.error('Error importing customers:', err);
    throw new Error(`Failed to import customers: ${err.response?.data?.message || err.message || 'Unknown error'}`);
  }
};
