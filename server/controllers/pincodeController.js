const fs = require('fs');
const path = require('path');

// WARNING: This approach loads a ~32MB file into memory.
// This is done to avoid a long delay on every API call, but it increases the server's memory footprint.
// A more robust solution would involve using a database for this data.
const pincodeDataPath = path.join(__dirname, '..', '..', 'apps', 'client', 'public', 'pincodes.json');
let pincodeData = [];
let states = [];

try {
  console.log('Loading pincode data into memory...');
  const rawData = fs.readFileSync(pincodeDataPath, 'utf8');
  pincodeData = JSON.parse(rawData);
  // Pre-calculate the list of unique states once on startup
  states = [...new Set(pincodeData.map(item => item.stateName))].sort();
  console.log('Pincode data loaded successfully.');
} catch (err) {
  console.error('FATAL: Could not load pincode data on server startup.', err);
  // The server will not be able to serve pincode requests.
}

// Controller function to get the list of all states
exports.getStates = (req, res) => {
  if (states.length === 0) {
    return res.status(500).json({ message: 'State data is not available on the server.' });
  }
  res.json(states);
};

// Controller function to get info for a specific pincode
exports.getPincodeInfo = (req, res) => {
  const { pincode } = req.params;

  if (pincodeData.length === 0) {
    return res.status(500).json({ message: 'Pincode data is not available on the server.' });
  }

  // Find the first match for the given pincode.
  // Note: Pincode is a string in the JSON, so we compare strings.
  const location = pincodeData.find(item => item.pincode === pincode);

  if (location) {
    res.json(location);
  } else {
    res.status(404).json({ message: 'Pincode not found' });
  }
};
