#!/usr/bin/env node

const { generateAndCacheDailyGuides } = require('./content');

(async () => {
  try {
    await generateAndCacheDailyGuides();
    console.log('✅ Today\'s premium guides generated and cached.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to generate today\'s guides:', err);
    process.exit(1);
  }
})();
