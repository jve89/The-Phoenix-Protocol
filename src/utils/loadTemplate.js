const fs = require('fs').promises;
const path = require('path');
const { logEvent } = require('./db_logger');

const templatesDir = path.resolve(__dirname, '../../templates') + path.sep;
const templateCache = new Map();

// Allow only root "<name>.html" or one-level "trial/<name>.html"
const FILENAME_RE = /^(?:trial\/)?[A-Za-z0-9._-]+\.html$/;

/**
 * Load an HTML template with strict path allowlist and caching.
 * Allowed:
 *   - "welcome.html" (in /templates)
 *   - "trial/female_moveon_day1.html" (in /templates/trial)
 * Returns '' on any error. Never throws.
 */
async function loadTemplate(filenameOrRel) {
  const inStr = String(filenameOrRel || '');

  // Validate against allowlist
  if (!FILENAME_RE.test(inStr)) {
    logEvent('loadTemplate', 'error', `Invalid template filename: ${inStr}`);
    return '';
  }

  // Resolve under /templates and block traversal
  const filePath = path.resolve(templatesDir, inStr);
  const rel = path.relative(templatesDir, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    logEvent('loadTemplate', 'error', `Path traversal detected: ${inStr}`);
    return '';
  }

  // Cache
  if (templateCache.has(inStr)) return templateCache.get(inStr);

  try {
    const content = await fs.readFile(filePath, 'utf8');
    if (!content || !content.trim()) {
      logEvent('loadTemplate', 'error', `Template empty: ${filePath}`);
      return '';
    }
    templateCache.set(inStr, content);
    return content;
  } catch (err) {
    logEvent('loadTemplate', 'error', `Failed to load template ${filePath}: ${err.message}`);
    return '';
  }
}

module.exports = { loadTemplate };
