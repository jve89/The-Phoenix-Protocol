// src/utils/loadTemplate.js

const fs = require('fs');
const path = require('path');

function loadTemplate(filename) {
  // 🛡️ Block path traversal and enforce .html extension
  if (
    typeof filename !== 'string' ||
    filename.includes('..') ||
    filename.includes('/') ||
    !filename.endsWith('.html')
  ) {
    console.error('[loadTemplate] Invalid template filename:', filename);
    return '';
  }

  const filePath = path.join(__dirname, '../../templates', filename);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (err) {
    console.error('[loadTemplate] Failed to load template:', filePath, err.message);
    return '';
  }
}

module.exports = { loadTemplate };
