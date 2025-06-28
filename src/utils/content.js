const axios = require('axios');

const generateTip = async (focus, gender) => {
  const prompts = require('../../content/prompts');
  const prompt = prompts[Math.floor(Math.random() * prompts.length)](focus, gender);
  try {
    const response = await axios.post('https://api.x.ai/v1/grok', {
      prompt,
      max_tokens: 100,
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROK_API_KEY}` }
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Grok API error:', error);
    const fallbacks = require('../../content/fallback.json');
    return fallbacks[Math.floor(Math.random() * fallbacks.length)][focus] || 'Stay strong today!';
  }
};

module.exports = { generateTip };