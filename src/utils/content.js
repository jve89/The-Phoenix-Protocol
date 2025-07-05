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
    fs.appendFileSync('fallback_used.log', fallbackLog);
    console.log(fallbackLog.trim());

    return fallback.content || 'Stay strong today with a moment of self-care.';
  }
};

// 🚀 NEW: Generate and cache today's premium guides
const generateAndCacheDailyGuides = async () => {
  const today = new Date().toISOString().split('T')[0];
  const cachePath = path.join(__dirname, '../../content/daily_cache', `${today}.json`);

  // Avoid regenerating if already exists
  if (fs.existsSync(cachePath)) {
    console.log(`[generateAndCacheDailyGuides] Cache for ${today} already exists, skipping generation.`);
    return;
  }

  console.log(`[generateAndCacheDailyGuides] Generating premium guides for ${today}...`);

  try {
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
    console.log(`[generateAndCacheDailyGuides] Premium guides cached at ${cachePath}`);

  } catch (error) {
    console.error('[generateAndCacheDailyGuides] Error during generation:', error.message);
  }
};

// 🚀 NEW: Load today's cached guide for given gender
const loadTodayGuide = (gender) => {
  const today = new Date().toISOString().split('T')[0];
  const cachePath = path.join(__dirname, '../../content/daily_cache', `${today}.json`);

  try {
    if (!fs.existsSync(cachePath)) {
      console.error(`[loadTodayGuide] Cache for ${today} not found.`);
      return null;
    }
    const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    if (gender === 'male' && data.male) return data.male;
    if (gender === 'female' && data.female) return data.female;
    return data.neutral;
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
