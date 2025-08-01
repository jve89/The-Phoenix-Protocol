const path = require('path');
const { subDays } = require('date-fns');
const db = require('../db/db');
const { logEvent } = require('./db_logger');
const { validateGuideContent } = require('../../src/utils/validateGuide');
const OpenAI = require('openai');
const MODELS = ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'];
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
const promptWarnings = {};

// PROMPT LOADING & DEBUG
for (const variant of VARIANTS) {
  const promptPath = path.resolve(__dirname, `../../content/prompts/${variant}.js`);
  try {
    const promptList = require(promptPath);
    if (!Array.isArray(promptList) || promptList.length === 0) {
      throw new Error(`Prompt list invalid or empty`);
    }

    const cleaned = [];
    const warnings = [];

    promptList.forEach((p, i) => {
      if (!p || typeof p !== 'object' || typeof p.prompt !== 'function') {
        warnings.push(`❌ Invalid prompt at index ${i}`);
        return;
      }

      try {
        const testOutput = p.prompt(...variant.split('_'));
        if (typeof testOutput !== 'string' || testOutput.trim().length < 100) {
          warnings.push(`⚠️ Weak output at index ${i} (${testOutput.length} chars)`);
        } else {
          cleaned.push(p);
        }
      } catch (e) {
        warnings.push(`❌ Error at index ${i}: ${e.message}`);
      }
    });

    promptCache[variant] = cleaned;
    if (warnings.length) {
      promptWarnings[variant] = warnings;
      logEvent('content', 'warn', `Prompt validation for ${variant}: ${warnings.length} issues`);
    }

  } catch (err) {
    logEvent('content', 'error', `Failed to load prompts for ${variant}: ${err.message}`);
    if (process.env.NODE_ENV === 'production') {
      continue;
    } else {
      throw err;
    }
  }
}

// === DEBUG PROMPT CACHE ===
console.log('[DEBUG] promptCache keys:', Object.keys(promptCache));
for (const variant of VARIANTS) {
  if (!promptCache[variant]) {
    console.log(`[DEBUG] promptCache missing: ${variant}`);
  } else {
    console.log(`[DEBUG] promptCache loaded: ${variant} (${promptCache[variant].length} prompts)`);
  }
}

/**
 * Generate a guide tip using AI, with model fallback.
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

  // --- Just pick a random prompt (no anti-repeat logic)
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

  // Model fallback logic
  let lastError = null;

  for (let i = 0; i < MODELS.length; i++) {
    try {
      const completion = await openai.chat.completions.create({
        model: MODELS[i],
        messages: [{ role: 'user', content: promptText }],
        temperature: 1.0,
        max_tokens: 1100
      });

      const output = completion.choices[0].message.content.trim();

      // Attempt to extract a title from the AI content (first line as H1 or sentence)
      const lines = output.split('\n').map(l => l.trim()).filter(Boolean);
      let title = '';
      if (lines[0].startsWith('#')) {
        title = lines[0].replace(/^#+\s*/, '');
      } else {
        title = lines[0];
      }

      // Validate title quality
      if (
        !title ||
        title.length < 5 ||
        title.toLowerCase() === variant.toLowerCase() ||
        /^[a-z_]+$/.test(title.toLowerCase())
      ) {
        logEvent('content', 'warn', `Rejected weak or default-like title for ${variant}: "${title}"`);
        throw new Error('Weak title');
      }

      const tempGuide = { [variant]: { title, content: output } };
      const { isValid, warnings } = validateGuideContent(tempGuide, [variant]);

      if (!isValid) {
        logEvent('content', 'warn', `Rejected weak AI output for ${variant}: ${warnings.join(' | ')}`);
        throw new Error('Weak AI output');
      }

      // No deduplication — lean DB, lean logic.

      return output;

    } catch (err) {
      lastError = err;
      logEvent('content', 'warn', `OpenAI model ${MODELS[i]} failed for ${variant}: ${err.message}`);

    }
  }

  logEvent('content', 'error', `All OpenAI models failed or returned weak content for ${variant}: ${lastError?.message}`);
  return 'Temporary AI failure. Please try again later.';
}

/**
 * Generate and store all six daily guides in DB.
 */
async function generateAndCacheDailyGuides() {
  const date = todayUtc();
  await logEvent('content', 'info', `Starting guide generation for ${date}`);
  const guideObj = {};

  for (const variant of VARIANTS) {
    const [gender, stage] = variant.split('_');
    try {
      await logEvent('content', 'info', `Generating ${variant}`);
      const content = await generateTip(gender, stage);
      
      console.log(`[DEBUG] Variant: ${variant}, Content: ${content ? '[OK]' : '[MISSING]'}`);

      const reviewed = await reviewStory(content);
      const score = await scoreStory(content);

      if (score) {
        await logEvent('qa', 'info', `[${variant}] Scores: ${JSON.stringify(score)}`);
      }
      if (reviewed && reviewed !== content) {
        await logEvent('qa', 'info', `[${variant}] Review delta:\n--- Original ---\n${content}\n--- Reviewed ---\n${reviewed}`);
      }

      const lines = content.split('\n').filter(Boolean);
      let title = (lines[0]?.replace(/^#+/, '').trim()) || 'Your Guide';
      if (!title || title.length > 100) {
        title = variant.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      }

      guideObj[variant] = {
        title,
        content,
        markdown: content  // 🔥 This fixes markdown email errors
      };
    } catch (err) {
      logEvent('content', 'error', `Generation error for ${variant}: ${err.message}`);
      guideObj[variant] = { title: null, content: null, markdown: null };
    }
  }

  console.log('[DEBUG] Generated guideObj:', JSON.stringify(guideObj, null, 2));
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

/**
 * Optional: Run GPT-based QA scoring for generated story.
 * Returns { scores: {}, notes: string }
 * This is only logged — not shown to users.
 */
async function scoreStory(storyContent) {
  const prompt = `
You are an expert editor for a healing-focused email product. Evaluate the following story on a scale from 1–10 for:

1. Clarity
2. Emotional relevance
3. Depth of insight
4. Originality
5. Usefulness to the reader

Also provide a short, constructive critique in 2–3 sentences.

Respond in the following JSON format:
{
  "clarity": X,
  "emotional_relevance": X,
  "depth": X,
  "originality": X,
  "usefulness": X,
  "notes": "your brief critique here"
}

Story:
${storyContent}
  `.trim();

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    });

    const raw = result.choices[0].message.content.trim();
    return JSON.parse(raw);
  } catch (err) {
    logEvent('qa', 'warn', `Scoring failed: ${err.message}`);
    return null;
  }
}

/**
 * Optional: Run GPT-based editing pass to improve structure, tone, and clarity.
 * Returns the edited version of the story.
 * For dev use only — not shown to users yet.
 */
async function reviewStory(storyContent) {
  const prompt = `
You are a senior editor for a breakup recovery email product. This story will be sent to emotionally vulnerable readers.

Please:
- Improve clarity and flow
- Remove generic fluff
- Sharpen emotional resonance
- Structure it clearly using best-practice storytelling
- Avoid repetition and vague language

Rewrite the story with care and insight. Return only the edited story.
  
Story to improve:
${storyContent}
  `.trim();

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1300
    });

    return result.choices[0].message.content.trim();
  } catch (err) {
    logEvent('qa', 'warn', `Review failed: ${err.message}`);
    return null;
  }
}

module.exports = {
  generateTip,
  generateAndCacheDailyGuides,
  loadTodayGuide,
  loadGuideByDate
};
