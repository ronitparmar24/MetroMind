// backend-node/src/services/gemini.service.js
// Wraps Google Gemini (gemini-2.0-flash) for two analytics features:
//   1. Weekly digest AI summary (2-3 warm, specific sentences from real stats)
//   2. Commuter personality description (one confident sentence)
//
// Caching strategy:
//   Module-level Map keyed by `${userId}:${date}:${type}` — regenerates at
//   most once per day per user per generation type.  Entirely in-process;
//   resets on server restart (acceptable — stale text is not harmful).

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Initialise lazily so a missing key doesn't crash the entire server boot
let _gemini = null;
let _model   = null;

function getModel() {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
  if (!_model) {
    _gemini = new GoogleGenerativeAI(GEMINI_API_KEY);
    _model  = _gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return _model;
}

// ── In-memory daily cache ─────────────────────────────────────────────────
// key: `${userId}:${YYYY-MM-DD}:${type}`  value: generated string
const _cache = new Map();

function _cacheKey(userId, type) {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${userId}:${date}:${type}`;
}

// ── Retry helper (handles transient 429s from free-tier quota) ────────────
async function _withRetry(fn, retries = 2, delayMs = 2000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err.message?.includes('429') || err.message?.includes('quota');
      if (is429 && attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

// ── Weekly Digest Summary ─────────────────────────────────────────────────
/**
 * Generate a 2-3 sentence warm, personalised weekly commute summary.
 * @param {string} userId  — for cache keying
 * @param {object} stats   — { tripCount, totalDistanceKm, totalSpent,
 *                             cabSavings, co2Saved, topRoute, offPeakRatio }
 * @returns {Promise<string>}
 */
async function generateWeeklyDigestText(userId, stats) {
  const key = _cacheKey(userId, 'digest');
  if (_cache.has(key)) return _cache.get(key);

  const {
    tripCount, totalDistanceKm, totalSpent,
    cabSavings, co2Saved, topRoute, offPeakRatio,
  } = stats;

  const prompt = `You are writing a short, warm, encouraging weekly commute summary for a metro app user. Use these real stats:
- ${tripCount} trips this week
- ${totalDistanceKm} km traveled
- ₹${totalSpent} spent, ₹${cabSavings} saved vs cab
- ${co2Saved} kg CO₂ saved
- Most used route: ${topRoute || 'various routes'}
- ${offPeakRatio}% of trips avoided peak crowd hours

Write exactly 2-3 sentences, second person ("you"), warm and specific to these numbers — not generic. No emojis. No markdown. Be concise and celebratory.`;

  try {
    const model = getModel();
    const text = await _withRetry(() =>
      model.generateContent(prompt).then(r => r.response.text().trim())
    );
    _cache.set(key, text);
    console.log(`✅ [Gemini] Digest generated for user ${userId.slice(0,8)}…`);
    return text;
  } catch (err) {
    console.error('⚠️  [Gemini] Weekly digest failed (using fallback):', err.message?.slice(0, 80));
    const fallback = tripCount > 0
      ? `You made ${tripCount} trip${tripCount !== 1 ? 's' : ''} this week, covering ${totalDistanceKm} km and saving ₹${cabSavings} compared to cab fares. Your metro use kept ${co2Saved} kg of CO₂ out of the atmosphere.`
      : 'No trips recorded this week — hop on the metro and start building your weekly streak!';
    _cache.set(key, fallback);
    return fallback;
  }
}

// ── Commuter Personality Description ─────────────────────────────────────
/**
 * Generate one confident, specific sentence explaining the personality type.
 * @param {string} userId
 * @param {string} personalityType  e.g. "The Early Bird"
 * @param {object} ratios           e.g. { earlyBirdRatio: 0.72, ... }
 * @returns {Promise<string>}
 */
async function generatePersonalityDescription(userId, personalityType, ratios) {
  const key = _cacheKey(userId, 'personality');
  if (_cache.has(key)) return _cache.get(key);

  const ratioText = Object.entries(ratios)
    .map(([k, v]) => `${k}: ${Math.round(v * 100)}%`)
    .join(', ');

  const prompt = `Write one confident, specific sentence explaining why a metro commuter is classified as "${personalityType}" based on these travel ratios: ${ratioText}. Second person ("you"), no emojis, no markdown, under 30 words. Be direct and insightful.`;

  try {
    const model = getModel();
    const text = await _withRetry(() =>
      model.generateContent(prompt).then(r => r.response.text().trim())
    );
    _cache.set(key, text);
    console.log(`✅ [Gemini] Personality generated for user ${userId.slice(0,8)}…`);
    return text;
  } catch (err) {
    console.error('⚠️  [Gemini] Personality failed (using fallback):', err.message?.slice(0, 80));
    const fallback = `You're classified as ${personalityType} based on your consistent travel patterns.`;
    _cache.set(key, fallback);
    return fallback;
  }
}

module.exports = { generateWeeklyDigestText, generatePersonalityDescription };
