// src/utils/generate_today_guide.js

const { generateAndCacheDailyGuides } = require('./content');
const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, '../../logs/generate_today_guide.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logPath, fullMessage, 'utf8');
  console.log(message);
}

(async () => {
  try {
    log('🚀 Starting daily premium guide generation...');
    await generateAndCacheDailyGuides();
    log('✅ Today\'s premium guides generated and cached successfully.');
    process.exit(0);
  } catch (err) {
    log(`❌ Error generating daily guides: ${err.stack || err}`);
    process.exit(1);
  }
})();
