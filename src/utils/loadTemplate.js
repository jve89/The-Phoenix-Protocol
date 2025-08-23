const fs = require('fs').promises;
const path = require('path');
const { logEvent } = require('./db_logger');

const templatesDir = path.resolve(__dirname, '../../templates') + path.sep;
const templateCache = new Map();

/**
 * Load an HTML template by filename, with caching and defensive checks.
 * @param {string} filename - Must be a plain filename ending with .html (no slashes).
 * @returns {Promise<string>} Template content or '' on error.
 */
async function loadTemplate(filename) {
  // Basic validation
  if (typeof filename !== 'string' || !filename.endsWith('.html') || filename.includes('/') || filename.includes('\\')) {
    logEvent('loadTemplate', 'error', `Invalid template filename: ${filename}`);
    return '';
  }

  // Cache hit
  if (templateCache.has(filename)) return templateCache.get(filename);

  // Resolve path and prevent traversal
  const filePath = path.resolve(templatesDir, filename);
  const rel = path.relative(templatesDir, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    logEvent('loadTemplate', 'error', `Path traversal detected: ${filename}`);
    return '';
  }

  try {
    const content = await fs.readFile(filePath, 'utf8');
    if (!content || !content.trim()) {
      logEvent('loadTemplate', 'error', `Template empty: ${filePath}`);
      return '';
    }
    templateCache.set(filename, content);
    return content;
  } catch (err) {
    logEvent('loadTemplate', 'error', `Failed to load template ${filePath}: ${err.message}`);
    return '';
  }
}

module.exports = { loadTemplate };
