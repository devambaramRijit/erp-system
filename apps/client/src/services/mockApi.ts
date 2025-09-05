// Define CustomerData interface
export interface CustomerData {
  id: string;
  customerName: string;
  houseNumber: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  landmark: string;
  mobileNumber1: string;
  mobileNumber2: string;
  source: string;
}

// Load customers from local storage or use default data
const loadCustomersFromStorage = (): CustomerData[] => {
  try {
    const stored = localStorage.getItem('customers');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading customers from storage:', error);
  }

  // Default data if nothing in storage
  return [
    {
      id: '1',
      customerName: 'John Doe',
      houseNumber: '123 Main St',
      city: 'New York',
      district: 'Manhattan',
      state: 'NY',
      pinCode: '10001',
      landmark: 'Near Central Park',
      mobileNumber1: '555-123-4567',
      mobileNumber2: '555-987-6543',
      source: 'Website'
    },
    {
      id: '2',
      customerName: 'Jane Smith',
      houseNumber: '456 Oak Ave',
      city: 'Los Angeles',
      district: 'Hollywood',
      state: 'CA',
      pinCode: '90028',
      landmark: 'Near Hollywood Sign',
      mobileNumber1: '555-234-5678',
      mobileNumber2: '',
      source: 'Referral'
    },
    {
      id: '3',
      customerName: 'Robert Johnson',
      houseNumber: '789 Pine Rd',
      city: 'Chicago',
      district: 'Loop',
      state: 'IL',
      pinCode: '60601',
      landmark: 'Near Willis Tower',
      mobileNumber1: '555-345-6789',
      mobileNumber2: '',
      source: 'Direct'
    },
    {
      id: '4',
      customerName: 'Emily Davis',
      houseNumber: '101 Oak Ln',
      city: 'Houston',
      district: 'Downtown',
      state: 'TX',
      pinCode: '77001',
      landmark: 'Near City Hall',
      mobileNumber1: '555-456-7890',
      mobileNumber2: '555-567-8901',
      source: 'Website'
    }
  ];
};

// Initialize mock customers
let mockCustomers: CustomerData[] = loadCustomersFromStorage();

// Save customers to local storage
const saveCustomersToStorage = () => {
  try {
    localStorage.setItem('customers', JSON.stringify(mockCustomers));
  } catch (error) {
    console.error('Error saving customers to storage:', error);
  }
};

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate a random ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export const mockCustomerApi = {
  // Get all customers
  getCustomers: async () => {
    await delay(500); // Simulate network delay
    return [...mockCustomers];
  },

  // Get a single customer by ID
  getCustomer: async (id: string) => {
    await delay(300);
    const customer = mockCustomers.find(c => c.id === id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return { ...customer };
  },

  // Create a new customer
  createCustomer: async (customerData: Omit<CustomerData, 'id'>) => {
    await delay(800);

    // Validate required fields
    if (!customerData.customerName || !customerData.mobileNumber1) {
      throw new Error('Customer name and mobile number are required');
    }

    const newCustomer: CustomerData = {
      ...customerData,
      id: generateId() // Generate a unique ID
    };

    mockCustomers.push(newCustomer);
    saveCustomersToStorage();
    return { ...newCustomer };
  },

  // Update an existing customer
  updateCustomer: async (id: string, customerData: Omit<CustomerData, 'id'>) => {
    await delay(800);

    const index = mockCustomers.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Customer not found');
    }

    // Validate required fields
    if (!customerData.customerName || !customerData.mobileNumber1) {
      throw new Error('Customer name and mobile number are required');
    }

    mockCustomers[index] = {
      ...customerData,
      id: id
    };

    saveCustomersToStorage();
    return { ...mockCustomers[index] };
  },

  // Delete a customer
  deleteCustomer: async (id: string) => {
    await delay(500);

    const index = mockCustomers.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Customer not found');
    }

    mockCustomers.splice(index, 1);
    saveCustomersToStorage();
    return { success: true };
  },

  // Import customers from Excel
  importCustomers: async (file: File) => {
    await delay(1500); // Simulate processing time

    try {
      // Dynamically import xlsx to parse the Excel file
      const XLSX = await import('xlsx');

      // Read the file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      // Get the first worksheet
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];

      // Convert worksheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip the header row and process the data
      const headerRow = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      // Map Excel column names to our field names
      const columnMapping: Record<string, string> = {
        'SL NO': 'id',
        'CUSTOMER NAME': 'customerName',
        'HOUSE NO./ FLAT NO./ STREET NO.': 'houseNumber',
        'CITY/TOWN/VILLAGE': 'city',
        'P.O/DISTRICT': 'district',
        'STATE': 'state',
        'PIN CODE': 'pinCode',
        'LANDMARK': 'landmark',
        'MOBILE NO.': 'mobileNumber1',
        'MOBILE NO. 2': 'mobileNumber2',
        'SOURCE': 'source'
      };

      // Process each row
      const newCustomers: CustomerData[] = [];

      for (const row of rows) {
        if (!row || row.length === 0) continue; // Skip empty rows

        const customer: Partial<CustomerData> = { id: generateId() };

        // Map each column to the corresponding field
        for (let i = 0; i < headerRow.length && i < row.length; i++) {
          const columnName = headerRow[i];
          const fieldName = columnMapping[columnName];

          if (fieldName && row[i] !== undefined && row[i] !== null) {
            // Convert to string and trim whitespace
            customer[fieldName as keyof CustomerData] = String(row[i]).trim();
          }
        }

        // Validate required fields
        if (customer.customerName && customer.mobileNumber1) {
          newCustomers.push(customer as CustomerData);
        }
      }

      // Add the new customers to our mock data
      mockCustomers.push(...newCustomers);
      saveCustomersToStorage();

      return { 
        success: true, 
        message: `Successfully imported ${newCustomers.length} customers from ${file.name}`,
        importedCount: newCustomers.length
      };
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};
