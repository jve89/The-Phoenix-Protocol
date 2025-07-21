const axios = require('axios');
const path = require('path');
const { subDays } = require('date-fns');
const db = require('../db/db');
const { logEvent } = require('./db_logger');

// Validate required environment variables at load time
const { GROK_API_KEY, GROK_MODEL_PRIMARY, GROK_MODEL_FALLBACKS } = process.env;
if (!GROK_API_KEY) {
  logEvent('content', 'error', 'Missing GROK_API_KEY for AI guide generation');
  throw new Error('Missing GROK_API_KEY');
}

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
 * Generate a guide tip using AI, with primary and fallback models and backoff.
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

  // Select random prompt
  const idx = Math.floor(Math.random() * prompts.length);
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

  // Build model list: primary then fallbacks, default to 'grok-4'
  const models = [];
  if (GROK_MODEL_PRIMARY) models.push(GROK_MODEL_PRIMARY);
  if (GROK_MODEL_FALLBACKS) {
    for (const m of GROK_MODEL_FALLBACKS.split(',').map(s => s.trim())) {
      if (m) models.push(m);
    }
  }
  if (models.length === 0) models.push('grok-4');

  // Attempt each model with retry/backoff
  for (const [i, model] of models.entries()) {
    try {
      logEvent('content', 'info', `Using model ${model} for ${variant}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        { messages: [{ role: 'user', content: promptText }], model, stream: false },
        { headers: { Authorization: `Bearer ${GROK_API_KEY}` }, signal: controller.signal }
      );
      clearTimeout(timeout);
      return res.data.choices[0].message.content.trim();
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'timeout' : err.message;
      logEvent('content', 'warn', `Model ${model} failed (${msg}) for ${variant}`);
      // exponential backoff before next model
      const delay = 1000 * Math.pow(2, i);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  logEvent('content', 'error', `All models failed for ${variant}`);
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
