import * as XLSX from 'xlsx';

export interface ImportResult {
  success: boolean;
  message: string;
  customers?: any[];
  error?: string;
}

class ImportService {
  // Default column mappings
  private defaultColumnMappings = {
    customerName: ['name', 'customer', 'customer name', 'client', 'client name', 'contact name'],
    mobileNumber1: ['phone', 'mobile', 'telephone', 'contact', 'phone number', 'mobile number', 'cell', 'cell phone'],
    addressLine1: ['address', 'house', 'house number', 'street', 'location', 'address line 1'],
    city: ['city', 'town', 'village'],
    state: ['state', 'province', 'region'],
    postalCode: ['pin', 'pincode', 'zip', 'postal code', 'postcode'],
    email: ['email', 'e-mail', 'mail', 'email address'],
    country: ['country', 'nation'],
    gstNumber: ['gst', 'gst number', 'tax id', 'tax number'],
    openingBalance: ['opening balance', 'balance', 'initial balance'],
    creditPeriod: ['credit period', 'payment terms', 'credit days'],
    creditLimit: ['credit limit', 'limit'],
    customerType: ['customer type', 'type', 'category'],
    notes: ['notes', 'remarks', 'comments', 'additional information']
  };

  // Process Excel file and extract customer data
  async processExcelFile(file: File): Promise<ImportResult> {
    try {
      // Validate file
      if (!this.validateFile(file)) {
        return {
          success: false,
          message: 'Invalid file format. Please upload a valid Excel or CSV file.',
          error: 'INVALID_FILE_FORMAT'
        };
      }

      // Read file
      const arrayBuffer = await this.readFileAsArrayBuffer(file);

      // Parse workbook
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Validate workbook
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return {
          success: false,
          message: 'No sheets found in the Excel file.',
          error: 'NO_SHEETS_FOUND'
        };
      }

      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        return {
          success: false,
          message: `Sheet "${sheetName}" is empty or could not be read.`,
          error: 'SHEET_NOT_READABLE'
        };
      }

      // Convert to JSON (with headers)
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        return {
          success: false,
          message: 'No data found in the Excel file.',
          error: 'NO_DATA_FOUND'
        };
      }

      // Process data
      const customers = this.processCustomerData(jsonData);

      if (customers.length === 0) {
        return {
          success: false,
          message: 'No valid customer data found in the file. Please ensure the file has the required columns (customer name and phone number).',
          error: 'NO_VALID_DATA'
        };
      }

      return {
        success: true,
        message: `Successfully processed ${customers.length} customers from the file.`,
        customers
      };
    } catch (error) {
      console.error('Error processing Excel file:', error);
      return {
        success: false,
        message: `Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'PROCESSING_ERROR'
      };
    }
  }

  // Validate uploaded file
  private validateFile(file: File): boolean {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    return validTypes.includes(file.type) || 
           file.name.endsWith('.xlsx') || 
           file.name.endsWith('.xls') || 
           file.name.endsWith('.csv');
  }

  // Read file as ArrayBuffer
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          resolve(event.target.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // Process customer data from JSON
  private processCustomerData(jsonData: any[]): any[] {
    if (!jsonData || jsonData.length === 0) {
      return [];
    }

    // Get headers from first row
    const firstRow = jsonData[0];
    const headers = Object.keys(firstRow).map(header => header.toLowerCase().trim());

    console.log('Available columns in Excel:', headers);

    // Create column mapping
    const columnMap: Record<string, string> = {};

    // Map columns based on header names
    Object.entries(this.defaultColumnMappings).forEach(([field, possibleNames]) => {
      const columnIndex = headers.findIndex(header => 
        possibleNames.some(name => header.includes(name))
      );

      if (columnIndex !== -1) {
        columnMap[field] = headers[columnIndex];
      }
    });

    // Fallback to direct mapping if no match found
    if (!columnMap.customerName && headers.includes('customername')) {
      columnMap.customerName = 'customername';
    }
    if (!columnMap.mobileNumber1 && headers.includes('mobile')) {
      columnMap.mobileNumber1 = 'mobile';
    }
    if (!columnMap.email && headers.includes('email')) {
      columnMap.email = 'email';
    }
    if (!columnMap.city && headers.includes('city')) {
      columnMap.city = 'city';
    }
    if (!columnMap.state && headers.includes('state')) {
      columnMap.state = 'state';
    }

    console.log('Column mapping:', columnMap);

    // Process each row
    return jsonData
      .map((row, index) => {
        try {
          // Extract customer data with proper fallbacks
          const customer: any = {
            id: `imported-${Date.now()}-${index}`,
            customerName: this.extractFieldValue(row, columnMap.customerName) || `Customer ${index + 1}`,
            mobileNumber1: this.extractFieldValue(row, columnMap.mobileNumber1) || '',
            email: this.extractFieldValue(row, columnMap.email) || '',
            addressLine1: this.extractFieldValue(row, columnMap.addressLine1) || '',
            city: this.extractFieldValue(row, columnMap.city) || '',
            state: this.extractFieldValue(row, columnMap.state) || '',
            postalCode: this.extractFieldValue(row, columnMap.postalCode) || '',
            country: this.extractFieldValue(row, columnMap.country) || 'USA',
            gstNumber: this.extractFieldValue(row, columnMap.gstNumber) || '',
            openingBalance: this.parseNumericValue(this.extractFieldValue(row, columnMap.openingBalance), 0),
            creditPeriod: this.parseNumericValue(this.extractFieldValue(row, columnMap.creditPeriod), 30),
            creditLimit: this.parseNumericValue(this.extractFieldValue(row, columnMap.creditLimit), 0),
            customerType: this.extractFieldValue(row, columnMap.customerType) || 'Regular',
            notes: this.extractFieldValue(row, columnMap.notes) || ''
          };

          // Validate required fields
          if (!customer.customerName || !customer.mobileNumber1) {
            console.log(`Skipping row ${index + 1}: Missing required fields`);
            return null;
          }

          return customer;
        } catch (error) {
          console.error(`Error processing row ${index + 1}:`, error);
          return null;
        }
      })
      .filter(Boolean); // Remove null entries
  }

  // Extract field value with fallback
  private extractFieldValue(row: any, fieldName?: string): string {
    if (!fieldName) return '';

    const value = row[fieldName];
    return value !== null && value !== undefined ? String(value).trim() : '';
  }

  // Parse numeric value with fallback
  private parseNumericValue(value: string, defaultValue: number): number {
    if (!value) return defaultValue;

    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
}

export const importService = new ImportService();
