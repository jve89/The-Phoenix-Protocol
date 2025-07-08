const fs = require('fs');
const path = require('path');

const loadTemplate = (filename) => {
  try {
    const filePath = path.join(__dirname, '../../templates', filename);
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('Template load error:', err);
    return '';
  }
};

module.exports = { loadTemplate };
