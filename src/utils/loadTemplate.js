const fs = require('fs').promises;
const path = require('path');
const { logEvent } = require('./db_logger');

const templatesDir = path.resolve(__dirname, '../../templates');
const templateCache = new Map();

/**
 * Asynchronously load an HTML template by filename, with caching and safety checks.
 * @param {string} filename - Name of the template file (must end with .html, no traversal).
 * @returns {Promise<string>} The template content, or empty string on error.
 */
async function loadTemplate(filename) {
  // Validate filename
  if (typeof filename !== 'string' || !filename.endsWith('.html')){
    logEvent('loadTemplate', 'error', `Invalid template filename: ${filename}`);
    return '';
  }

  // Return from cache if available
  if (templateCache.has(filename)) {
    return templateCache.get(filename);
  }

  const filePath = path.join(templatesDir, filename);
  // Ensure resolved path is within templatesDir
  if (!filePath.startsWith(templatesDir)) {
    logEvent('loadTemplate', 'error', `Path traversal detected: ${filename}`);
    return '';
  }

  try {
    const content = await fs.readFile(filePath, 'utf8');
    templateCache.set(filename, content);
    return content;
  } catch (err) {
    logEvent('loadTemplate', 'error', `Failed to load template ${filePath}: ${err.message}`);
    return '';
  }
}

module.exports = { loadTemplate };
