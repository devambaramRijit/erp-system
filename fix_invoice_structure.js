
const fs = require('fs');
const path = './apps/client/src/InvoiceScreen.tsx';

// Read the file
fs.readFile(path, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Find the line with the table
  const tableLine = '        <table className="invoice-table">';
  const tableIndex = data.indexOf(tableLine);
  if (tableIndex === -1) {
    console.error('Could not find table line');
    return;
  }

  // Find the start of the line
  let lineStart = tableIndex;
  while (lineStart > 0 && data[lineStart - 1] !== '\n') {
    lineStart--;
  }

  // Replace the line with the fixed version
  const result = data.substring(0, lineStart) + 
    '             </div>\n' +
    '           </div>\n' +
    '        </div>\n' +
    '\n' +
    data.substring(lineStart);

  // Write the result to the file
  fs.writeFile(path, result, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('File fixed successfully!');
  });
});
