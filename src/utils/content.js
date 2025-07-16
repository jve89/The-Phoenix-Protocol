require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { format, subDays } = require('date-fns');
const db = require('../db/db');

const fallbackPrompts = require('../../content/fallback.json');

const generateTip = async (gender, goalStage) => {
  const variant = `${gender}_${goalStage}`;
  const promptFilePath = path.join(__dirname, `../../content/prompts/${variant}.js`);

  let promptList;
  try {
    promptList = require(promptFilePath);
  } catch (err) {
    console.error(`❌ Missing or invalid prompt file: ${promptFilePath}`);
    return `Your guide is temporarily unavailable — please check back tomorrow.`;
  }

  const promptObj = promptList[Math.floor(Math.random() * promptList.length)];

  let prompt;
  if (typeof promptObj === 'object' && typeof promptObj.prompt === 'function') {
    prompt = promptObj.prompt(gender, goalStage);
  } else if (typeof promptObj === 'string') {
    prompt = promptObj;
  } else if (typeof promptObj === 'function') {
    prompt = promptObj(gender, goalStage);
  } else {
    console.error(`❌ Invalid prompt format for ${variant}`);
    return `Your guide is temporarily unavailable — please check back tomorrow.`;
  }

  try {
    console.log(`[generateTip] ${variant} → Prompt:`, String(prompt).slice(0, 100), '...');

    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      messages: [{ role: "user", content: prompt }],
      model: process.env.GROK_MODEL || "grok-3-latest",
      stream: false,
      temperature: 0.7,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content.trim();

  } catch (error) {
    console.error(`❌ Grok error for ${variant}:`, error.response?.data || error.message);

    const fallback = fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)];
    const fallbackLog = `[${new Date().toISOString()}] Fallback used for ${variant}: ${fallback.title || 'Untitled'}\n`;
    fs.appendFileSync(path.join(__dirname, '../../logs/fallback_used.log'), fallbackLog);

    return fallback.content || 'Today, focus on yourself and take a deep breath.';
  }
};

const generateAndCacheDailyGuides = async () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const debugLogPath = path.join(__dirname, '../../logs/generate_today_guide_debug.log');

  const debugLog = (msg) => {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(debugLogPath, `[${timestamp}] ${msg}\n`, 'utf8');
    console.log(msg);
  };

  try {
    debugLog(`🚀 Starting full guide generation for ${today}`);

    const combos = [
      ['male', 'moveon'],
      ['male', 'reconnect'],
      ['female', 'moveon'],
      ['female', 'reconnect'],
      ['neutral', 'moveon'],
      ['neutral', 'reconnect']
    ];

    const cache = { date: today };

    for (const [gender, goalStage] of combos) {
      const variant = `${gender}_${goalStage}`;
      debugLog(`🧠 Generating: ${variant}`);

      const content = await generateTip(gender, goalStage);
      const title = content.split('\n')[0].replace(/#/g, '').trim() || 'Your Premium Guide';

      cache[variant] = { title, content };
    }

    await db.query(`
      INSERT INTO daily_guides (date, guide)
      VALUES ($1, $2)
      ON CONFLICT (date) DO UPDATE SET guide = EXCLUDED.guide
    `, [today, JSON.stringify(cache)]);

    debugLog(`✅ Daily guide stored in database for ${today}`);
    debugLog(`🎉 All 6 variants generated successfully.`);

  } catch (err) {
    debugLog(`❌ Fatal error in guide generation: ${err.stack || err.message}`);
  }
};

const loadGuideByDate = async (dateStr) => {
  try {
    const { rows } = await db.query(
      `SELECT guide FROM daily_guides WHERE date = $1`,
      [dateStr]
    );
    return rows.length ? rows[0].guide : null;
  } catch (err) {
    console.error(`[loadGuideByDate] DB error for ${dateStr}:`, err.message);
    return null;
  }
};

const loadTodayGuide = async () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  return await loadGuideByDate(today) || await loadGuideByDate(yesterday);
};

module.exports = {
  generateTip,
  generateAndCacheDailyGuides,
  loadTodayGuide,
  loadGuideByDate
};
