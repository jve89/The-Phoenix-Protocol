// src/utils/validateGuide.js

function validateGuideContent(guide, variants = []) {
  const warnings = [];

  for (const variant of variants) {
    const section = guide[variant];
    if (!section) {
      warnings.push(`🟥 Missing section for variant: ${variant}`);
      continue;
    }

    const { title, content } = section;

    if (!content || !content.trim()) {
      warnings.push(`🟥 Empty content for variant: ${variant}`);
      continue;
    }

    if (title?.trim().toLowerCase() === variant.toLowerCase()) {
      warnings.push(`⚠️ Title equals variant key for ${variant}: "${title}"`);
    }

    if (content.trim().length < 150) {
      warnings.push(`⚠️ Content for ${variant} looks too short (${content.trim().length} chars)`);
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
}

module.exports = { validateGuideContent };
