const path = require('path');
const { subDays } = require('date-fns');
const db = require('../db/db');
const { logEvent } = require('./db_logger');
const { Configuration, OpenAIApi } = require('openai'); // npm install openai
const MODELS = ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'];
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

// Helper: UTC date string YYYY-MM-DD
function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

// Load and validate prompt files synchronously at startup
const VARIANTS = [
  'male_moveon', 'male_reconnect',
  'female_moveon', 'female_reconnect',
  'neutral_moveon', 'neutral_reconnect'
];
const promptCache = {};
for (const variant of VARIANTS) {
  const promptPath = path.resolve(__dirname, `../../content/prompts/${variant}.js`);
  try {
    const promptList = require(promptPath);
    if (!Array.isArray(promptList) || promptList.length === 0) {
      throw new Error(`Prompt list invalid or empty for ${variant}`);
    }
    promptCache[variant] = promptList;
  } catch (err) {
    logEvent('content', 'error', `Failed to load prompts for ${variant}: ${err.message}`);
    throw err;
  }
}

/**
 * Generate a guide tip using AI, with model fallback and anti-repeat prompt logic.
 * @param {string} gender
 * @param {string} goalStage
 * @returns {Promise<string>}
 */
async function generateTip(gender, goalStage) {
  const variant = `${gender}_${goalStage}`;
  const prompts = promptCache[variant];
  if (!prompts) {
    logEvent('content', 'error', `No prompts for variant ${variant}`);
    return 'Guide unavailable at this time.';
  }

  // --- Anti-repeat: Avoid last N days' prompts
  const N = 7; // Days to avoid repeats (adjust as needed)
  let used = [];
  try {
    const { rows } = await db.query(
      `SELECT prompt_idx FROM used_prompts WHERE variant = $1 AND date >= $2`,
      [variant, subDays(new Date(), N).toISOString().slice(0, 10)]
    );
    used = rows.map(r => r.prompt_idx);
  } catch (err) {
    logEvent('content', 'warn', `Could not query used_prompts for ${variant}: ${err.message}`);
  }
  const usedSet = new Set(used);

  // Get unused prompt indexes; fallback to all if pool exhausted
  const allIndexes = prompts.map((_, i) => i);
  const unusedIndexes = allIndexes.filter(i => !usedSet.has(i));
  let idx;
  if (unusedIndexes.length === 0) {
    idx = Math.floor(Math.random() * prompts.length);
  } else {
    idx = unusedIndexes[Math.floor(Math.random() * unusedIndexes.length)];
  }
  const promptObj = prompts[idx];
  let promptText;
  try {
    if (typeof promptObj === 'string') {
      promptText = promptObj;
    } else if (typeof promptObj.prompt === 'function') {
      promptText = promptObj.prompt(gender, goalStage);
    } else {
      throw new Error('Invalid prompt object');
    }
  } catch (err) {
    logEvent('content', 'error', `Building prompt for ${variant} failed: ${err.message}`);
    return 'Guide generation error.';
  }

  // Model fallback logic
  for (let i = 0; i < MODELS.length; i++) {
    try {
      const completion = await openai.createChatCompletion({
        model: MODELS[i],
        messages: [{ role: 'user', content: promptText }],
        temperature: 1.0,
        max_tokens: 1100
      });
      // Log this prompt as used for this variant and day
      await db.query(
        `INSERT INTO used_prompts (date, variant, prompt_idx)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [todayUtc(), variant, idx]
      );
      return completion.data.choices[0].message.content.trim();
    } catch (err) {
      logEvent('content', 'warn', `OpenAI model ${MODELS[i]} failed for ${variant}: ${err.message}`);
      // fallback to next model
    }
  }
  logEvent('content', 'error', `All OpenAI models failed for ${variant}`);
  return 'Temporary AI failure. Please try again later.';
}

/**
 * Generate and store all six daily guides in DB.
 */
async function generateAndCacheDailyGuides() {
  const date = todayUtc();
  await logEvent('content', 'info', `Starting guide generation for ${date}`);
  const guideObj = { date };

  for (const variant of VARIANTS) {
    const [gender, stage] = variant.split('_');
    try {
      await logEvent('content', 'info', `Generating ${variant}`);
      const content = await generateTip(gender, stage);
      const lines = content.split('\n').filter(Boolean);
      const title = (lines[0]?.replace(/^#+/, '').trim()) || 'Your Guide';
      guideObj[variant] = { title, content };
    } catch (err) {
      logEvent('content', 'error', `Generation error for ${variant}: ${err.message}`);
      guideObj[variant] = { title: null, content: null };
    }
  }

  try {
    await db.query(
      `INSERT INTO daily_guides (date, guide)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (date) DO UPDATE SET guide = EXCLUDED.guide`,
      [date, guideObj]
    );
    await logEvent('content', 'info', `Stored daily guide for ${date}`);
  } catch (err) {
    await logEvent('content', 'error', `DB write failed for ${date}: ${err.message}`);
  }
}

/**
 * Load guide JSON for a given date.
 */
async function loadGuideByDate(dateStr) {
  try {
    const { rows } = await db.query(
      `SELECT guide FROM daily_guides WHERE date = $1`,
      [dateStr]
    );
    return rows[0]?.guide || null;
  } catch (err) {
    await logEvent('content', 'error', `loadGuideByDate(${dateStr}) failed: ${err.message}`);
    return null;
  }
}

/**
 * Load today's guide, falling back to yesterday if missing.
 */
async function loadTodayGuide() {
  const today = todayUtc();
  const yesterday = subDays(new Date(), 1).toISOString().slice(0, 10);
  return (await loadGuideByDate(today)) || (await loadGuideByDate(yesterday));
}

module.exports = {
  generateTip,
  generateAndCacheDailyGuides,
  loadTodayGuide,
  loadGuideByDate
};
