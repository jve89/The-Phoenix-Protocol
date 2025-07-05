// src/utils/generate_today_guide.js

const { generateAndCacheDailyGuides } = require('./content');

(async () => {
  await generateAndCacheDailyGuides();
  console.log('✅ Today\'s premium guides generated and cached.');
  process.exit(0);
})();
