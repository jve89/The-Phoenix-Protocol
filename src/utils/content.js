require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { format, subDays } = require('date-fns');

const malePrompts = require('../../content/prompts/male');
const femalePrompts = require('../../content/prompts/female');
const neutralPrompts = require('../../content/prompts/neutral');

// Generates one premium guide for a gender
const generateTip = async (gender) => {
  let promptList;

  if (gender === 'male') promptList = malePrompts;
  else if (gender === 'female') promptList = femalePrompts;
  else promptList = neutralPrompts;

  const prompt = promptList[Math.floor(Math.random() * promptList.length)](gender);

  try {
    console.log('[generateTip] Using prompt:', prompt.slice(0, 120), '...');

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
    console.error('Grok API error:', error.response?.data || error.message);

    const fallbacks = require('../../content/fallback.json');
    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

    const fallbackLog = `[${new Date().toISOString()}] Fallback used: ${fallback.title || 'No title'}\n`;
    fs.appendFileSync(path.join(__dirname, '../../logs/fallback_used.log'), fallbackLog);
    console.log(fallbackLog.trim());

    return fallback.content || 'Stay strong today with a moment of self-care.';
  }
};

// ✅ Generates and saves one JSON file per day
const generateAndCacheDailyGuides = async () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const cacheDir = path.join(__dirname, '../../content/daily_cache');
  const cachePath = path.join(cacheDir, `${today}.json`);
  const debugLogPath = path.join(__dirname, '../../logs/generate_today_guide_debug.log');

  const debugLog = (msg) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${msg}\n`;
    fs.appendFileSync(debugLogPath, logEntry, 'utf8');
    console.log(msg);
  };

  try {
    debugLog(`🚀 Starting premium guide generation for ${today}`);

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
      debugLog(`Created missing cache directory: ${cacheDir}`);
    }

    if (fs.existsSync(cachePath)) {
      debugLog(`Cache for ${today} already exists at ${cachePath}, skipping generation.`);
      return;
    }

    debugLog(`Generating Grok-based tips...`);

    const maleGuide = await generateTip('male');
    const femaleGuide = await generateTip('female');
    const neutralGuide = await generateTip('prefer not to say');

    const data = {
      date: today,
      male: {
        title: maleGuide.split('\n')[0].replace(/#/g, '').trim() || 'Your Premium Guide',
        content: maleGuide
      },
      female: {
        title: femaleGuide.split('\n')[0].replace(/#/g, '').trim() || 'Your Premium Guide',
        content: femaleGuide
      },
      neutral: {
        title: neutralGuide.split('\n')[0].replace(/#/g, '').trim() || 'Your Premium Guide',
        content: neutralGuide
      }
    };

    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
    debugLog(`✅ Premium guides cached at ${cachePath}`);
    debugLog(`🎉 Generation and caching complete.`);
  } catch (error) {
    debugLog(`❌ Error during guide generation: ${error.stack || error.message}`);
  }
};

// ✅ Load guide for any date
const loadGuideByDate = (dateStr) => {
  const cachePath = path.join(__dirname, '../../content/daily_cache', `${dateStr}.json`);
  try {
    if (!fs.existsSync(cachePath)) return null;
    const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    return data;
  } catch (error) {
    console.error(`[loadGuideByDate] Failed to load ${dateStr}:`, error.message);
    return null;
  }
};

// ✅ Tries today → fallback to yesterday
const loadTodayGuide = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const todayGuide = loadGuideByDate(today);
  if (todayGuide) return todayGuide;

  const fallback = loadGuideByDate(yesterday);
  if (fallback) {
    console.warn(`⚠️ Today's guide missing — falling back to ${yesterday}`);
    return fallback;
  }

  return null;
};

module.exports = {
  generateTip,
  generateAndCacheDailyGuides,
  loadTodayGuide,
  loadGuideByDate
};
