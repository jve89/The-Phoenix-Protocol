// src/utils/validateGuide.js

/**
 * Validate the content object for all variants.
 * @param {Object} guide - The guide object containing all variants.
 * @param {string[]} variants - Array of variant keys to check.
 * @param {number} minLength - Optional minimum content length.
 * @returns {{ isValid: boolean, warnings: string[] }}
 */
function validateGuideContent(guide, variants = [], minLength = 500) {
  const warnings = [];
  let hasErrors = false;

  for (const variant of variants) {
    const section = guide[variant];
    if (!section) {
      warnings.push(`🟥 Missing section for variant: ${variant}`);
      hasErrors = true;
      continue;
    }

    const { title, content } = section;

    if (!content || typeof content !== 'string' || !content.trim()) {
      warnings.push(`🟥 Empty or invalid content for variant: ${variant}`);
      hasErrors = true;
      continue;
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
      warnings.push(`🟥 Missing or invalid title for variant: ${variant}`);
      hasErrors = true;
    } else if (title.trim().toLowerCase() === variant.toLowerCase()) {
      warnings.push(`⚠️ Title equals variant key for ${variant}: "${title}"`);
    }

    if (content.trim().length < minLength) {
      warnings.push(`⚠️ Content for ${variant} looks too short (${content.trim().length} chars)`);
    }
  }

  return {
    isValid: !hasErrors,
    warnings
  };
}

module.exports = { validateGuideContent };
