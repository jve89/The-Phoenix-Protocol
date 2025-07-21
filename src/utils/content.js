// src/utils/content.js

require('dotenv').config();
const axios = require('axios');
const path = require('path');
const { format, subDays } = require('date-fns');
const db = require('../db/db');

// ⚠️ Preload and validate prompt files at startup
const VARIANTS = [
  'male_moveon', 'male_reconnect',
  'female_moveon', 'female_reconnect',
  'neutral_moveon', 'neutral_reconnect'
];
const promptCache = {};
(function initPrompts() {
  for (const variant of VARIANTS) {
    try {
      const promptList = require(
        path.join(__dirname, `../../content/prompts/${variant}.js`)
      );
      if (!Array.isArray(promptList) || promptList.length === 0) {
        throw new Error(`Prompt file is not a non-empty array: ${variant}`);
      }
      promptCache[variant] = promptList;
    } catch (err) {
      console.error(`[initPrompts] Failed to load ${variant}:`, err);
      // Exit on startup to ensure missing prompts are addressed immediately
      process.exit(1);
    }
  }
})();

// 🔧 Centralized log writer for monitoring
async function logEvent(source, level, message) {
  try {
    await db.query(
      `INSERT INTO guide_generation_logs (timestamp, source, level, message)
       VALUES (NOW(), $1, $2, $3)`,
      [source, level, message]
    );
  } catch (err) {
    console.error(`[logEvent] Failed to write log:`, err);
  }
}

// 🧠 Generate one AI-generated guide (with model fallback logic)
async function generateTip(gender, goalStage) {
  const variant = `${gender}_${goalStage}`;
  const promptList = promptCache[variant];

  if (!promptList) {
    await logEvent('content', 'error', `Missing prompt list: ${variant}`);
    return `Your guide is temporarily unavailable — please check back soon.`;
  }

  // Pick a random prompt object and validate
  const idx = Math.floor(Math.random() * promptList.length);
  const promptObj = promptList[idx];
  if (!promptObj) {
    await logEvent('content', 'error', `Empty prompt at index ${idx} for ${variant}`);
    return `Your guide is temporarily unavailable — please check back soon.`;
  }

  let promptText;
  try {
    if (typeof promptObj.prompt === 'function') {
      promptText = promptObj.prompt(gender, goalStage);
    } else if (typeof promptObj === 'string') {
      promptText = promptObj;
    } else if (typeof promptObj === 'function') {
      promptText = promptObj(gender, goalStage);
    } else {
      throw new Error(`Invalid prompt object format at ${variant}[${idx}]`);
    }
  } catch (err) {
    await logEvent('content', 'error', `Error building prompt for ${variant}: ${err.message}`);
    return `Your guide is temporarily unavailable — please check back soon.`;
  }

  const modelList = [];
  if (process.env.GROK_MODEL_PRIMARY) modelList.push(process.env.GROK_MODEL_PRIMARY);
  if (process.env.GROK_MODEL_FALLBACKS) {
    for (const m of process.env.GROK_MODEL_FALLBACKS.split(',').map(s => s.trim())) {
      if (m) modelList.push(m);
    }
  }
  if (modelList.length === 0) {
    modelList.push('grok-4');
  }

  for (const model of modelList) {
    try {
      console.log(`[generateTip] ${variant} → Using model: ${model}`);
      const res = await axios.post(
        'https://api.x.ai/v1/chat/completions',
        {
          messages: [{ role: 'user', content: promptText }],
          model,
          stream: false,
          temperature: 0.7,
          max_tokens: 1100
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      return res.data.choices[0].message.content.trim();
    } catch (err) {
      await logEvent('content', 'warn', `Model ${model} failed for ${variant}: ${err.message}`);
      console.warn(`[generateTip] Model ${model} failed for ${variant}.`);
    }
  }

  await logEvent('content', 'error', `All models failed for ${variant}`);
  return `We're experiencing a temporary issue generating your guide — please try again later.`;
}

// 📅 Generate and cache all 6 variants
async function generateAndCacheDailyGuides() {
  const utcDate = new Date().toISOString().slice(0, 10);
  await logEvent('content', 'info', `Starting guide generation for ${utcDate}`);

  const combos = [
    ['male', 'moveon'], ['male', 'reconnect'],
    ['female', 'moveon'], ['female', 'reconnect'],
    ['neutral', 'moveon'], ['neutral', 'reconnect']
  ];
  const guideObject = { date: utcDate };

  for (const [gender, goalStage] of combos) {
    const variant = `${gender}_${goalStage}`;
    try {
      await logEvent('content', 'info', `Generating ${variant}`);
      const content = await generateTip(gender, goalStage);
      const lines = content.split('\n').filter(Boolean);
      const title = lines[0].replace(/^#+/, '').trim() || 'Your Premium Guide';
      guideObject[variant] = { title, content };
    } catch (err) {
      await logEvent('content', 'error', `Failed ${variant}: ${err.message}`);
      guideObject[variant] = { title: null, content: null, error: err.message };
    }
  }

  try {
    await db.query(
      `INSERT INTO daily_guides (date, guide)
       VALUES ($1, $2)
       ON CONFLICT (date) DO UPDATE SET guide = EXCLUDED.guide`,
      [utcDate, JSON.stringify(guideObject)]
    );
    await logEvent('content', 'info', `Daily guide stored for ${utcDate}`);
  } catch (err) {
    await logEvent('content', 'error', `DB insert failed: ${err.message}`);
    console.error('[generateAndCacheDailyGuides] DB error:', err);
  }
}

// 📖 Load from DB by date
async function loadGuideByDate(dateStr) {
  try {
    const { rows } = await db.query(
      `SELECT guide FROM daily_guides WHERE date = $1`,
      [dateStr]
    );
    return rows.length ? rows[0].guide : null;
  } catch (err) {
    await logEvent('content', 'error', `loadGuideByDate(${dateStr}): ${err.message}`);
    return null;
  }
}

// 📖 Load today's guide (fallback to yesterday)
async function loadTodayGuide() {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = subDays(new Date(), 1).toISOString().slice(0, 10);
  return (await loadGuideByDate(today)) || (await loadGuideByDate(yesterday));
}

module.exports = {
  generateTip,
  generateAndCacheDailyGuides,
  loadTodayGuide,
  loadGuideByDate
};
