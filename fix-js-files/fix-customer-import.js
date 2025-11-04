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

  // Fix the fetchCustomers function to remove localStorage fallback
  const fixedCode = data.replace(
    /} catch \(backendErr\) {\s*console\.error\('Error fetching customers from backend:', backendErr\);\s*\/\/ Fallback to localStorage if backend fails[\s\S]*?}\s*}/g,
    `} catch (backendErr) {
        console.error('Error fetching customers from backend:', backendErr);
        alert(\`Error fetching customers: \${backendErr.response?.data?.message || backendErr.message || 'Unknown error'}\`);
        setCustomers([]);
        setFilteredCustomers([]);
      }`
  );

  // Write the fixed code back to the file
  fs.writeFile(filePath, fixedCode, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('File fixed successfully!');
  });
});
