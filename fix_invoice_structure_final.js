
const fs = require('fs');
const path = './apps/client/src/InvoiceScreen.tsx';

// Read the file
fs.readFile(path, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Find the position of the first </div> after the notes section
  const notesSectionEnd = data.indexOf('        )}\n      </div>');
  if (notesSectionEnd === -1) {
    console.error('Could not find notes section end');
    return;
  }

  // Find the position of the end of the hidden div
  const hiddenDivEnd = data.indexOf('      </div>', notesSectionEnd + 1);
  if (hiddenDivEnd === -1) {
    console.error('Could not find hidden div end');
    return;
  }

  // Get the content after the hidden div
  const contentAfterHiddenDiv = data.substring(hiddenDivEnd + 10);

  // Check if there are duplicate sections
  if (contentAfterHiddenDiv.includes('<div>')) {
    // Replace the content with just the hidden div closing
    const result = data.substring(0, hiddenDivEnd + 10) + '\n        </div>\n      </div>';

    // Write the result to the file
    fs.writeFile(path, result, 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
      console.log('File fixed successfully!');
    });
  } else {
    // Just add the missing closing tag
    const result = data.substring(0, hiddenDivEnd + 10) + '\n        </div>\n      </div>';

    // Write the result to the file
    fs.writeFile(path, result, 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
      console.log('File fixed successfully!');
    });
  }
});
