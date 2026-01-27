import { localStorageService } from './localStorageService';
import { CustomerData } from './mockApi';

class CustomerService {
  async getCustomers(): Promise<CustomerData[]> {
    const customers = localStorageService.getItems('erp_customers');
    return customers.map(customer => ({
      ...customer,
      customerName: customer.name || customer.customerName,
      mobileNumber1: customer.phone || customer.mobileNumber1,
    }));
  }

  async getCustomer(id: string): Promise<CustomerData | undefined> {
    const customers = await this.getCustomers();
    return customers.find(customer => customer.id === id);
  }

  async createCustomer(customerData: Omit<CustomerData, 'id'>): Promise<CustomerData> {
    const newCustomer = { ...customerData, id: Date.now().toString() };
    localStorageService.addItem('erp_customers', newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, customerData: Partial<CustomerData>): Promise<CustomerData> {
    const customers = await this.getCustomers();
    const customerIndex = customers.findIndex(customer => customer.id === id);
    if (customerIndex === -1) {
      throw new Error('Customer not found');
    }
    const updatedCustomer = { ...customers[customerIndex], ...customerData };
    customers[customerIndex] = updatedCustomer;
    localStorageService.saveItems('erp_customers', customers);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<void> {
    const customers = await this.getCustomers();
    const newCustomers = customers.filter(customer => customer.id !== id);
    localStorageService.saveItems('erp_customers', newCustomers);
  }
}

export const customerService = new CustomerService();