// src/utils/validateGuide.js

/**
 * Validate the content object for all variants.
 * Strict: only fail (isValid=false) for missing/invalid fields.
 * Heuristics emit warnings but do not fail the guide.
 *
 * @param {Object} guide - The guide object containing all variants.
 * @param {string[]} variants - Array of variant keys to check.
 * @param {number} minLength - Optional minimum content length.
 * @returns {{ isValid: boolean, warnings: string[] }}
 */
function validateGuideContent(guide, variants = [], minLength = 500) {
  const warnings = [];
  let hasErrors = false;

  // Defensive guards
  if (!guide || typeof guide !== 'object') {
    return { isValid: false, warnings: ['🟥 Guide is not an object'] };
  }
  if (!Array.isArray(variants) || variants.length === 0) {
    warnings.push('⚠️ No variants provided to validator');
  }

  // Simple sanitizer heuristics
  const UNSAFE_HTML = /<(script|iframe|object|embed|link|style)\b|on\w+=/i;
  const PLACEHOLDER = /{{\s*[^}]+\s*}}/; // unresolved handlebars-style tokens

  for (const variant of variants) {
    const section = guide[variant];
    if (!section || typeof section !== 'object') {
      warnings.push(`🟥 Missing section for variant: ${variant}`);
      hasErrors = true;
      continue;
    }

    let { title, content } = section;

    // Title checks
    if (typeof title !== 'string') title = '';
    const titleTrim = title.trim();

    if (!titleTrim) {
      warnings.push(`🟥 Missing or invalid title for variant: ${variant}`);
      hasErrors = true;
    } else {
      if (titleTrim.toLowerCase() === String(variant).toLowerCase()) {
        warnings.push(`⚠️ Title equals variant key for ${variant}: "${titleTrim}"`);
      }
      if (titleTrim.length > 120) {
        warnings.push(`⚠️ Title too long for ${variant} (${titleTrim.length} chars)`);
      }
      // Excessive uppercase ratio heuristic
      const upperRatio =
        titleTrim.replace(/[^A-Z]/g, '').length / Math.max(1, titleTrim.replace(/[^A-Za-z]/g, '').length);
      if (upperRatio > 0.7 && titleTrim.length >= 8) {
        warnings.push(`⚠️ Title looks shouty for ${variant}`);
      }
    }

    // Content checks
    if (typeof content !== 'string') content = '';
    const contentTrim = content.trim();

    if (!contentTrim) {
      warnings.push(`🟥 Empty or invalid content for variant: ${variant}`);
      hasErrors = true;
      continue;
    }

    if (contentTrim.length < minLength) {
      warnings.push(`⚠️ Content for ${variant} looks too short (${contentTrim.length} chars)`);
    }
    if (UNSAFE_HTML.test(contentTrim)) {
      warnings.push(`⚠️ Potentially unsafe HTML detected in ${variant}`);
    }
    if (PLACEHOLDER.test(contentTrim)) {
      warnings.push(`⚠️ Unresolved placeholder detected in ${variant} (e.g., "{{...}}")`);
    }

    // Redundant H1 check: first line is a Markdown H1 duplicating title
    const firstLine = contentTrim.split('\n').find(Boolean) || '';
    const firstLineTitle = firstLine.replace(/^#+\s*/, '').trim();
    if (firstLine.startsWith('#') && titleTrim && firstLineTitle === titleTrim) {
      warnings.push(`⚠️ ${variant}: content repeats title as H1; consider removing leading H1`);
    }
  }

  return {
    isValid: !hasErrors,
    warnings
  };
}

module.exports = { validateGuideContent };
