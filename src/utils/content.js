require('dotenv').config();
const axios = require('axios');

const generateTip = async (gender) => {
  const prompts = require('../../content/prompts');
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
    return fallbacks[Math.floor(Math.random() * fallbacks.length)].generic ||
      'Stay strong today with a moment of self-care.';
  }
};

module.exports = { generateTip };
