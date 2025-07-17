const fs = require('fs');
const path = require('path');

const loadTemplate = (filename) => {
  // Basic validation to prevent path traversal attacks
  if (typeof filename !== 'string' || filename.includes('..') || filename.includes('/')) {
    console.error('Invalid template filename:', filename);
    return '';
  }

  try {
    const filePath = path.join(__dirname, '../../templates', filename);
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error('Template load error:', err);
    return '';
  }
};

module.exports = { loadTemplate };
