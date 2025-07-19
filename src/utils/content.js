// src/utils/content.js

require('dotenv').config();
const axios = require('axios');
const path = require('path');
const { format, subDays } = require('date-fns');
const db = require('../db/db');

// Cache loaded prompts keyed by variant
const promptCache = {};

// 🔧 Centralized log writer for monitoring
async function logEvent(source, level, message) {
  await db.query(
    `INSERT INTO guide_generation_logs (source, level, message)
     VALUES ($1, $2, $3)`
  , [source, level, message]);
}

// 🔁 Load and cache prompt lists from content/prompts
function getPromptList(variant) {
  if (promptCache[variant]) return promptCache[variant];
  try {
    const promptList = require(
      path.join(__dirname, `../../content/prompts/${variant}.js`)
    );
    promptCache[variant] = promptList;
    return promptList;
  } catch {
    return null;
  }
}

// 🧠 Generate one AI-generated guide
const generateTip = async (gender, goalStage) => {
  const variant = `${gender}_${goalStage}`;
  const promptList = getPromptList(variant);

  if (!promptList) {
    await logEvent('content', 'error', `Missing or invalid prompt file: ${variant}`);
    return `Your guide is temporarily unavailable — please check back tomorrow.`;
  }

  const promptObj = promptList[
    Math.floor(Math.random() * promptList.length)
  ];
  let prompt;

  if (typeof promptObj?.prompt === 'function') {
    prompt = promptObj.prompt(gender, goalStage);
  } else if (typeof promptObj === 'string') {
    prompt = promptObj;
  } else if (typeof promptObj === 'function') {
    prompt = promptObj(gender, goalStage);
  } else {
    await logEvent('content', 'error', `Invalid prompt format for ${variant}`);
    return `Your guide is temporarily unavailable — please check back tomorrow.`;
  }

  try {
    console.log(`[generateTip] ${variant} → Prompt:`, String(prompt).slice(0, 100), '...');
    const res = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        messages: [{ role: 'user', content: prompt }],
        model: process.env.GROK_MODEL || 'grok-3-latest',
        stream: false,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.data.choices[0].message.content.trim();
  } catch (err) {
    await logEvent('content', 'error', `Grok error for ${variant}: ${err.message}`);
    return `We're experiencing a temporary error generating your guide. Please try again later.`;
  }
};

// 📅 Generate and cache all 6 variants
const generateAndCacheDailyGuides = async () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  await logEvent('content', 'info', `🚀 Starting guide generation for ${today}`);

  const combos = [
    ['male', 'moveon'], ['male', 'reconnect'],
    ['female', 'moveon'], ['female', 'reconnect'],
    ['neutral', 'moveon'], ['neutral', 'reconnect']
  ];
  const guideObject = { date: today };

  for (const [gender, goalStage] of combos) {
    const variant = `${gender}_${goalStage}`;
    await logEvent('content', 'info', `🧠 Generating ${variant}`);
    const content = await generateTip(gender, goalStage);
    const title = content.split('\n')[0].replace(/#/g, '').trim() || 'Your Premium Guide';
    guideObject[variant] = { title, content };
  }

  await db.query(
    `INSERT INTO daily_guides (date, guide)
     VALUES ($1, $2)
     ON CONFLICT (date) DO UPDATE SET guide = EXCLUDED.guide`,
    [today, JSON.stringify(guideObject)]
  );

  await logEvent('content', 'info', `✅ Daily guide stored for ${today}`);
};

// 📖 Load from DB by date
const loadGuideByDate = async (dateStr) => {
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
};

// 📖 Load today's guide (fallback to yesterday)
const loadTodayGuide = async () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  return (await loadGuideByDate(today)) || (await loadGuideByDate(yesterday));
};

module.exports = {
  generateTip,
  generateAndCacheDailyGuides,
  loadTodayGuide,
  loadGuideByDate
};
