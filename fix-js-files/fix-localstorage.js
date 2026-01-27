const fs = require('fs');
const path = require('path');

// Function to copy file with error handling
function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`Successfully copied ${src} to ${dest}`);
  } catch (err) {
    console.error(`Error copying ${src} to ${dest}:`, err);
  }
}

// Get the source directory
const srcDir = path.join(__dirname, '..', 'apps', 'client', 'src');

// Files to replace
const replacements = [
  {
    src: path.join(srcDir, 'SimpleProductTab-final.tsx'),
    dest: path.join(srcDir, 'SimpleProductTab.tsx')
  },
  {
    src: path.join(srcDir, 'services', 'invoiceService-new.ts'),
    dest: path.join(srcDir, 'services', 'invoiceService.ts')
  },
  {
    src: path.join(srcDir, 'services', 'inventoryService-new.ts'),
    dest: path.join(srcDir, 'services', 'inventoryService.ts')
  }
];

// Perform replacements
replacements.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    copyFile(src, dest);
  } else {
    console.error(`Source file not found: ${src}`);
  }
});

console.log('File replacements completed!');
