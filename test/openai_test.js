const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o', // or whichever model you use
      messages: [{ role: 'user', content: 'Test prompt: Say hello.' }]
    });
    console.log(resp.choices[0].message.content);
  } catch (err) {
    console.error('OpenAI test failed:', err);
  }
})();
