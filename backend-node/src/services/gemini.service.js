// backend-node/src/services/gemini.service.js
// Wraps Google Gemini (gemini-2.0-flash) and Groq (llama-3.3-70b-versatile) for analytics features:
//   1. Weekly digest AI summary (2-3 warm, specific sentences from real stats)
//   2. Commuter personality description (one confident sentence)
//   3. Feedback analysis
//
// Caching strategy (upgraded from in-memory Map to Upstash Redis):
//   Key  : 'ai:<userId>:<YYYY-MM-DD>:<type>'  e.g. 'ai:abc123:2026-08-14:digest'
//   TTL  : 86 400 seconds (24 hours) — regenerates once per day per user.
//   Why Redis: persists across restarts; shared across all serverless instances.

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const redis = require('../config/redis');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

if (!GEMINI_API_KEY && !GROQ_API_KEY) {
  console.info('[AI] No API keys set — AI features will use built-in fallbacks.');
}

let _gemini = null;
let _geminiModel = null;
let _groq = null;

function getGeminiModel() {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
  if (!_geminiModel) {
    _gemini = new GoogleGenerativeAI(GEMINI_API_KEY);
    _geminiModel = _gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return _geminiModel;
}

function getGroqClient() {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured');
  if (!_groq) {
    _groq = new Groq({ apiKey: GROQ_API_KEY });
  }
  return _groq;
}

// ── Redis cache helpers ───────────────────────────────────────────────────
const AI_CACHE_TTL = 86400; // 24 hours in seconds

function _cacheKey(userId, type) {
  const date = new Date().toISOString().slice(0, 10);
  return `ai:${userId}:${date}:${type}`;
}

async function _cacheGet(key) {
  try {
    const val = await redis.get(key);
    return val ? (typeof val === 'string' ? val : JSON.stringify(val)) : null;
  } catch (_) { return null; } // Redis unavailable — treat as cache miss
}

async function _cacheSet(key, text) {
  try {
    await redis.set(key, text, { ex: AI_CACHE_TTL });
  } catch (_) { /* non-fatal — generation result is still returned */ }
}

// ── Fallback Generation Chain ─────────────────────────────────────────────

async function _callGemini(prompt) {
  const model = getGeminiModel();
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini timeout')), 4000)
  );
  
  const text = await Promise.race([
    model.generateContent(prompt).then(r => r.response.text().trim()),
    timeoutPromise,
  ]);
  return text;
}

async function _callGroq(prompt) {
  const client = getGroqClient();
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Groq timeout')), 4000)
  );

  const response = await Promise.race([
    client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    }),
    timeoutPromise,
  ]);
  
  return response.choices[0].message.content.trim();
}

async function _generateWithFallback(prompt, fallbackText, featureName = 'AI') {
  const providers = [
    { name: 'Gemini', call: _callGemini },
    { name: 'Groq', call: _callGroq }
  ];

  for (const provider of providers) {
    try {
      const text = await provider.call(prompt);
      console.log(`✅ [${provider.name}] ${featureName} generated successfully.`);
      return text;
    } catch (err) {
      console.log(`⚠️  [${provider.name}] failed, trying next: ${err.message?.slice(0, 80)}`);
      continue;
    }
  }

  // Both providers failed or were not configured
  console.log(`❌ [Fallback] All providers failed. Using static template.`);
  return fallbackText;
}

// ── Weekly Digest Summary ─────────────────────────────────────
async function generateWeeklyDigestText(userId, stats) {
  const key = _cacheKey(userId, 'digest');
  const hit = await _cacheGet(key);
  if (hit) return hit;

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

  const fallback = tripCount > 0
    ? `You made ${tripCount} trip${tripCount !== 1 ? 's' : ''} this week, covering ${totalDistanceKm} km and saving ₹${cabSavings} compared to cab fares. Your metro use kept ${co2Saved} kg of CO₂ out of the atmosphere.`
    : 'No trips recorded this week — hop on the metro and start building your weekly streak!';

  const text = await _generateWithFallback(prompt, fallback, 'Weekly Digest');
  await _cacheSet(key, text);
  return text;
}

// ── Commuter Personality Description ─────────────────────────────
async function generatePersonalityDescription(userId, personalityType, ratios) {
  const key = _cacheKey(userId, 'personality');
  const hit = await _cacheGet(key);
  if (hit) return hit;

  const ratioText = Object.entries(ratios)
    .map(([k, v]) => `${k}: ${Math.round(v * 100)}%`)
    .join(', ');

  const prompt = `Write one confident, specific sentence explaining why a metro commuter is classified as "${personalityType}" based on these travel ratios: ${ratioText}. Second person ("you"), no emojis, no markdown, under 30 words. Be direct and insightful.`;

  const fallback = `You're classified as ${personalityType} based on your consistent travel patterns.`;

  const text = await _generateWithFallback(prompt, fallback, 'Personality');
  await _cacheSet(key, text);
  return text;
}

// ── Feedback Analysis ─────────────────────────────────────────────────────
async function analyzeFeedback(text, userName = 'Passenger') {
  const prompt = `You are a strict but warm customer support AI for the MetroMind app (Ahmedabad Metro).
Analyze this user feedback: "${text}"

CRITICAL INSTRUCTION: First, determine if the feedback is valid. 
- If it is gibberish (e.g. keyboard smashes like "dshadygfyadhfdfbjh", "hksahsagdjhagsdhjagsd").
- If it is completely nonsensical or just random characters.
- If it is too short to have any meaning.
In these cases, set "isValid" to false.

Return ONLY a valid JSON object matching this schema exactly (no markdown, no backticks, no other text):
{
  "isValid": <boolean, true if meaningful feedback, false if gibberish or nonsensical>,
  "category": "service" | "cleanliness" | "safety" | "app" | "other",
  "moodRating": <number from 1 (terrible) to 5 (amazing) based on sentiment>,
  "aiReply": "<If isValid is true: A 1-2 sentence empathetic, personalized reply directly addressing their feedback, starting with 'Hi ${userName}'. If isValid is false: 'Please provide meaningful feedback. Random text cannot be processed.'>"
}`;

  const isGibberish = text.trim().length < 4 || (text.length > 15 && !text.includes(' '));
  const fallbackJson = JSON.stringify({
    isValid: !isGibberish,
    category: 'other',
    moodRating: 3,
    aiReply: isGibberish ? 'Please provide meaningful feedback. Random text cannot be processed.' : 'Thank you for your feedback! Our team will look into this.'
  });

  const cleanJsonText = await _generateWithFallback(prompt, fallbackJson, 'Feedback Analysis');
  
  try {
    let cleanJson = cleanJsonText;
    if (cleanJson.startsWith('\`\`\`')) {
      const match = cleanJson.match(/\`\`\`(?:json)?\n([\s\S]*?)\`\`\`/);
      if (match) cleanJson = match[1].trim();
    }
    const parsed = JSON.parse(cleanJson);
    return {
      isValid: parsed.isValid !== false,
      category: parsed.category || 'other',
      moodRating: parsed.moodRating || 3,
      aiReply: parsed.aiReply || 'Thank you for your feedback! We appreciate you taking the time to share your thoughts.'
    };
  } catch (err) {
    return JSON.parse(fallbackJson);
  }
}

module.exports = { generateWeeklyDigestText, generatePersonalityDescription, analyzeFeedback };
