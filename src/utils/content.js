require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Uses your existing Grok prompt generator
const prompts = require('../../content/prompts');

// Generates one premium guide for a gender
const generateTip = async (gender) => {
  const prompt = prompts[Math.floor(Math.random() * prompts.length)](gender);

  try {
    console.log('[generateTip] Using prompt:', prompt.slice(0, 120), '...');

    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      messages: [{ role: "user", content: prompt }],
      model: process.env.GROK_MODEL || "grok-3-latest",
      stream: false,
      temperature: 0.7,
      max_tokens: 1000 // supports ~500-word outputs
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

// 🚀 Patched generateAndCacheDailyGuides with debug logging
const generateAndCacheDailyGuides = async () => {
  const today = new Date().toISOString().split('T')[0];
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

    // Ensure the directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
      debugLog(`Created missing cache directory: ${cacheDir}`);
    }

    // Skip if file exists
    if (fs.existsSync(cachePath)) {
      debugLog(`Cache for ${today} already exists at ${cachePath}, skipping generation.`);
      return;
    }

    debugLog(`Generating Grok-based tips...`);

    const maleGuide = await generateTip('male');
    debugLog(`✅ Male guide generated: ${maleGuide.slice(0, 100)}...`);

    const femaleGuide = await generateTip('female');
    debugLog(`✅ Female guide generated: ${femaleGuide.slice(0, 100)}...`);

    const neutralGuide = await generateTip('prefer not to say');
    debugLog(`✅ Neutral guide generated: ${neutralGuide.slice(0, 100)}...`);

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

// 🚀 Load today's full cached guide object
const loadTodayGuide = () => {
  const today = new Date().toISOString().split('T')[0];
  const cachePath = path.join(__dirname, '../../content/daily_cache', `${today}.json`);

  try {
    if (!fs.existsSync(cachePath)) {
      console.error(`[loadTodayGuide] Cache for ${today} not found.`);
      return null;
    }
    const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    return data; // Return the entire guide object
  } catch (error) {
    console.error('[loadTodayGuide] Error loading cached guide:', error.message);
    return null;
  }
};

module.exports = {
  generateTip,
  generateAndCacheDailyGuides,
  loadTodayGuide
};
