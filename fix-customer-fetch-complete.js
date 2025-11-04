const fs = require('fs');
const path = require('path');

// Path to the CustomerScreen.tsx file
const filePath = path.join(__dirname, 'apps', 'client', 'src', 'CustomerScreen.tsx');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Find the start and end of the fetchCustomers function
  const startMatch = data.match(/const fetchCustomers = async \(\) => {/);
  if (!startMatch) {
    console.error('Could not find fetchCustomers function');
    return;
  }

  const startIndex = startMatch.index;

  // Find the end of the function by counting braces
  let braceCount = 0;
  let endIndex = startIndex;
  let inFunction = false;

  for (let i = startIndex; i < data.length; i++) {
    const char = data[i];
    if (char === '{' && !inFunction) {
      inFunction = true;
      braceCount = 1;
    } else if (inFunction) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }
  }

  if (endIndex <= startIndex) {
    console.error('Could not find end of fetchCustomers function');
    return;
  }

  // New fetchCustomers function implementation
  const newFunction = `const fetchCustomers = async () => {
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
  };`;

  // Replace the function in the file
  const fixedCode = data.substring(0, startIndex) + newFunction + data.substring(endIndex);

  // Write the fixed code back to the file
  fs.writeFile(filePath, fixedCode, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('File fixed successfully!');
  });
});
