const fs = require('fs');
const path = require('path');

// Path to the CustomerScreen.tsx file
const filePath = path.join(__dirname, 'apps', 'client', 'src', 'CustomerScreen.tsx');

// Read the original file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Extract the imports and other parts we want to keep
  const importsMatch = data.match(/^[\s\S]+?const CustomerScreen = \(\) => {/m);
  if (!importsMatch) {
    console.error('Could not find imports section');
    return;
  }

  // Extract the rest of the file after the fetchCustomers function
  const restMatch = data.match(/};\s*\n\s*const handleInputChange =/m);
  if (!restMatch) {
    console.error('Could not find rest of file');
    return;
  }

  // Create the new file content
  const newContent = `${importsMatch[0]}
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    mobileNumber1: '',
    mobileNumber2: '',
    houseNumber: '',
    city: '',
    district: '',
    state: '',
    pinCode: '',
    source: 'Direct',
    notes: '',
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch customers from the backend
  const fetchCustomers = async () => {
    try {
      setIsLoading(true);

      // Always try to fetch fresh data from backend
      try {
        const response = await axios.get('/api/customers', { withCredentials: true });
        const customerData = Array.isArray(response.data) ? response.data : [];
        setCustomers(customerData);
        setFilteredCustomers(customerData);
        // Update localStorage with fresh data
        localStorage.setItem('customers', JSON.stringify(customerData));
      } catch (backendErr) {
        console.error('Error fetching customers from backend:', backendErr);
        alert(\`Error fetching customers: \${backendErr.response?.data?.message || backendErr.message || 'Unknown error'}\`);
        setCustomers([]);
        setFilteredCustomers([]);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      alert(\`Error fetching customers: \${err instanceof Error ? err.message : 'Unknown error'}\`);
    } finally {
      setIsLoading(false);
    }
  };

  ${restMatch[0]}`;

  // Write the new content to the file
  fs.writeFile(filePath, newContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('File fixed successfully!');
  });
});
