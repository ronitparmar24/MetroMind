// backend-node/src/controllers/voice.controller.js
// MetroMind Voice AI — Gemini 2.0 Flash via direct REST (bypasses SDK quota issues)
// + rich local NLP fallback that always works with live DB data.

const User   = require('../models/User.model');
const Ticket = require('../models/Ticket.model');
const Wallet = require('../models/Wallet.model');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// Use v1 endpoint — lower quota pressure than v1beta used by the JS SDK
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── Gemini REST call (direct fetch, no SDK) ───────────────────────────────
async function callGemini(systemPrompt, userMessage, history = []) {
  if (!GEMINI_API_KEY) throw new Error('No key');

  const contents = [
    ...history,                                         // prior turns
    { role: 'user', parts: [{ text: userMessage }] },  // current turn
  ];

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 200, temperature: 0.75, topP: 0.9 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const res  = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${data.error?.message || 'unknown'}`);
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  } finally {
    clearTimeout(timer);
  }
}

// ── Retry with backoff for 429 ─────────────────────────────────────────────
async function geminiWithRetry(systemPrompt, userMessage, history, maxRetries = 2) {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await callGemini(systemPrompt, userMessage, history);
    } catch (err) {
      const is429 = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('exceeded');
      const isTimeout = err.name === 'AbortError';
      if ((is429 || isTimeout) && i < maxRetries) {
        const wait = is429 ? 2000 * (i + 1) : 1000;
        console.warn(`[VoiceAI] ${is429 ? '429 quota' : 'timeout'} — retry ${i + 1} in ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
}

// ── System prompt for voice AI ────────────────────────────────────────────
function buildSystemPrompt(ctx) {
  return `You are MetroMind Voice AI — a friendly, smart assistant for the MetroMind Ahmedabad Metro app.

LIVE USER DATA:
- Name: ${ctx.name || 'Commuter'}
- Wallet: ₹${ctx.walletBalance ?? 0}
- Upcoming tickets: ${ctx.activeTickets || 0}${ctx.nextTicket ? ' — next: ' + ctx.nextTicket : ''}
- Weather: ${ctx.weather || 'unknown'}
- Time: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST

AHMEDABAD METRO:
- Blue Line: 32 stations (Vastral Gam ↔ Thaltej Gam). Runs 6 AM–11 PM daily.
- Fare: ₹5 base + ₹1.5 per station, max ₹40. Peak: 8–10 AM, 5–8 PM (weekdays).
- Key stations: Thaltej, Gujarat University, Ghatlodiya, Vadaj, Kalupur, Vastral, GNLU, Naroda, Nikol, Shilaj, Bopal.
- Thaltej↔Kalupur: ~18 stops, ₹32, ~35 min. GNLU↔Kalupur: ~12 stops, ₹23, ~25 min.

NAVIGATION — append exactly ONE of these when navigating:
[ACTION:NAVIGATE:/book] [ACTION:NAVIGATE:/wallet] [ACTION:NAVIGATE:/my-tickets] [ACTION:NAVIGATE:/live-trains] [ACTION:NAVIGATE:/journey-planner] [ACTION:NAVIGATE:/analytics]

RULES: Be concise (≤40 words). Use live data above — never invent wallet/ticket figures. Only add [ACTION:...] when actually navigating.`;
}

// ── Clean history for Gemini (strict user/model alternation) ──────────────
function sanitizeHistory(history) {
  const clean = [];
  let last = null;
  for (const h of history.slice(-8)) {
    const role = h.role === 'user' ? 'user' : 'model';
    if (role !== last) {
      clean.push({ role, parts: [{ text: h.text }] });
      last = role;
    }
  }
  // History must NOT end with a user turn (that's the current message's role)
  while (clean.length && clean[clean.length - 1].role === 'user') clean.pop();
  return clean;
}

// ── LOCAL NLP (always works, uses live data) ──────────────────────────────
const STATIONS = [
  ['thaltej gam', 'Thaltej Gam'], ['thaltej', 'Thaltej'], ['doordarshan', 'Doordarshan'],
  ['gujarat university', 'Gujarat University'], ['commerce', 'Commerce Six Roads'],
  ['gujarat college', 'Gujarat College'], ['high court', 'Old High Court'],
  ['ghatlodiya', 'Ghatlodiya'], ['vadaj', 'Vadaj'], ['apmc', 'APMC'],
  ['kalupur', 'Kalupur'], ['maninagar', 'Maninagar'], ['vastral gam', 'Vastral Gam'],
  ['vastral', 'Vastral'], ['gnlu', 'GNLU'], ['shilaj', 'Shilaj'], ['bopal', 'Bopal'],
  ['naroda', 'Naroda'], ['nikol', 'Nikol'], ['rabari', 'Rabari Colony'],
];

function extractStations(t) {
  return STATIONS.filter(([key]) => t.includes(key)).map(([, name]) => name);
}

function stationIndex(name) {
  return STATIONS.findIndex(([, n]) => n === name);
}

function calcFare(a, b) {
  const i = stationIndex(a), j = stationIndex(b);
  if (i < 0 || j < 0) return null;
  return Math.min(5 + Math.abs(i - j) * 1.5, 40);
}

function crowdNow() {
  const h = new Date().getHours(), d = new Date().getDay();
  if (d === 0 || d === 6) return { level: 'Low', label: 'light crowd (weekend)' };
  if ((h >= 8 && h < 10) || (h >= 17 && h < 20)) return { level: 'High',   label: 'busy peak hours' };
  if ((h >= 6 && h < 8)  || (h >= 20 && h < 23)) return { level: 'Medium', label: 'moderate crowd' };
  return { level: 'Low', label: 'light crowd' };
}

function localNLP(text, ctx) {
  const t = text.toLowerCase().trim();
  const found = extractStations(t);
  const crowd = crowdNow();
  const bal   = ctx.walletBalance ?? 0;

  // Fare / cost
  if ((t.includes('fare') || t.includes('cost') || t.includes('how much') || t.includes('price')) && found.length >= 2) {
    const fare = calcFare(found[0], found[1]);
    if (fare) return { reply: `${found[0]} → ${found[1]}: ₹${Math.round(fare)}. ${crowd.level === 'High' ? 'Currently peak hours — busier than usual.' : 'Good time to travel!'}`, action: null };
  }

  // Wallet / balance
  if (t.includes('wallet') || t.includes('balance') || (t.includes('how much') && t.includes('money'))) {
    const low = bal < 50;
    return {
      reply: `Your wallet balance is ₹${bal}. ${low ? "It's running low — want to top up?" : 'You\'re all set for your journey!'}`,
      action: low ? { type: 'NAVIGATE', target: '/wallet' } : null,
    };
  }

  // Book / buy ticket
  if (t.includes('book') || t.includes('buy ticket') || t.includes('purchase') || (t.includes('new') && t.includes('ticket'))) {
    return { reply: 'Opening ticket booking now! 🎫', action: { type: 'NAVIGATE', target: '/book' } };
  }

  // My tickets / upcoming
  if (t.includes('my ticket') || t.includes('upcoming') || t.includes('my booking') || t.includes('my trip')) {
    if (ctx.activeTickets > 0) {
      return {
        reply: `You have ${ctx.activeTickets} upcoming trip${ctx.activeTickets > 1 ? 's' : ''}. ${ctx.nextTicket ? 'Next: ' + ctx.nextTicket + '.' : ''} Opening tickets now!`,
        action: { type: 'NAVIGATE', target: '/my-tickets' },
      };
    }
    return { reply: 'No upcoming trips yet. Want to book one?', action: { type: 'NAVIGATE', target: '/book' } };
  }

  // Live trains
  if (t.includes('live') || t.includes('next train') || t.includes('arriving') || (t.includes('train') && !t.includes('ticket'))) {
    return { reply: 'Opening live train tracker — see real-time arrivals! 🚇', action: { type: 'NAVIGATE', target: '/live-trains' } };
  }

  // Crowd
  if (t.includes('crowd') || t.includes('busy') || t.includes('rush') || t.includes('packed') || t.includes('how full')) {
    const station = found[0] || 'the metro';
    return {
      reply: `${station} has ${crowd.label} right now. ${crowd.level === 'High' ? 'Try waiting 30–45 min for it to ease.' : 'Great time to travel!'}`,
      action: null,
    };
  }

  // Schedule / timing
  if (t.includes('timing') || t.includes('schedule') || t.includes('when does') || t.includes('frequency') || t.includes('how often')) {
    return { reply: `Metro runs 6 AM – 11 PM daily. Every 8 min peak, every 15 min off-peak. Currently ${crowd.label}.`, action: null };
  }

  // Journey planner / route
  if (t.includes('route') || t.includes('plan') || t.includes('how to go') || t.includes('how to reach') || t.includes('directions')) {
    if (found.length >= 2) {
      const fare = calcFare(found[0], found[1]);
      return {
        reply: `Planning route: ${found[0]} → ${found[1]}${fare ? ` (~₹${Math.round(fare)})` : ''}. Opening journey planner!`,
        action: { type: 'NAVIGATE', target: '/journey-planner' },
      };
    }
    return { reply: 'Opening journey planner — pick your stations for full route details! 🗺️', action: { type: 'NAVIGATE', target: '/journey-planner' } };
  }

  // Analytics
  if (t.includes('analytics') || t.includes('stats') || t.includes('weekly') || t.includes('digest') || t.includes('personality') || t.includes('how much have i spent')) {
    return { reply: 'Opening your travel analytics — weekly digest, CO₂ saved, and commuter personality! 📊', action: { type: 'NAVIGATE', target: '/analytics' } };
  }

  // Weather
  if (t.includes('weather') || t.includes('rain') || t.includes('temperature') || t.includes('hot') || t.includes('umbrella')) {
    if (ctx.weather) return { reply: `Ahmedabad right now: ${ctx.weather}. ${ctx.isRaining ? 'Carry an umbrella! 🌧️' : 'Weather looks good for commuting! ☀️'}`, action: null };
    return { reply: "I don't have live weather data right now — check before you head out! ⛅", action: null };
  }

  // Greeting
  if (t.match(/^(hi|hello|hey|namaste|good morning|good afternoon|good evening)[\s!.]*$/)) {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return { reply: `${greet}${ctx.name ? ', ' + ctx.name : ''}! 👋 I can check your wallet (₹${bal}), upcoming tickets, fares, crowd levels, or book a new trip. What do you need?`, action: null };
  }

  // Help
  if (t.includes('help') || t.includes('what can you') || t.includes('commands') || t.includes('what do you')) {
    return { reply: `I can: check wallet (₹${bal}), show upcoming tickets, calculate fares, check crowd levels, show live trains, or navigate anywhere. Just ask naturally!`, action: null };
  }

  // Fare between stations mentioned in text (even without explicit "fare" keyword)
  if (found.length >= 2) {
    const fare = calcFare(found[0], found[1]);
    if (fare) return { reply: `${found[0]} → ${found[1]}: approx ₹${Math.round(fare)}, currently ${crowd.label}.`, action: null };
  }

  // Default
  const tips = ['wallet balance', 'book a ticket', 'busy right now', 'fare from Thaltej to Kalupur'];
  return { reply: `I can help with metro fares, tickets, wallet (₹${bal}), and live trains. Try: "${tips[Math.floor(Math.random() * tips.length)]}"`, action: null };
}

// ── POST /api/voice/chat ──────────────────────────────────────────────────
exports.voiceChat = async (req, res) => {
  try {
    const { userMessage, history = [], context = {} } = req.body;
    if (!userMessage?.trim()) return res.status(400).json({ success: false, error: 'userMessage required' });

    // ── Enrich context with live DB data ────────────────────────────────
    let ctx = { ...context };
    try {
      const [user, wallet, tickets] = await Promise.all([
        User.findById(req.user._id).select('name').lean(),
        Wallet.findOne({ userId: req.user._id }).select('balance').lean(),
        Ticket.find({ userId: req.user._id, status: 'upcoming' })
          .sort({ travelDate: 1 }).limit(3)
          .select('source destination travelDate travelTime').lean(),
      ]);
      ctx.name          = user?.name;
      ctx.walletBalance = wallet?.balance ?? 0;
      ctx.activeTickets = tickets.length;
      if (tickets.length > 0) {
        const t  = tickets[0];
        const dt = new Date(t.travelDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        ctx.nextTicket = `${t.source} → ${t.destination} on ${dt} at ${t.travelTime}`;
      }
    } catch (_) { /* best-effort */ }

    // ── Try Gemini (with retry) ─────────────────────────────────────────
    if (GEMINI_API_KEY) {
      try {
        const sysPrompt = buildSystemPrompt(ctx);
        const gemHistory = sanitizeHistory(history);
        const aiText = await geminiWithRetry(sysPrompt, userMessage.trim(), gemHistory);

        // Parse ACTION tag
        let action = null;
        const m = aiText.match(/\[ACTION:NAVIGATE:([^\]]+)\]/);
        if (m) { action = { type: 'NAVIGATE', target: m[1].trim() }; }
        const reply = aiText.replace(/\[ACTION:[^\]]+\]/g, '').trim();

        console.log(`🤖 [VoiceAI/Gemini] "${userMessage.slice(0,30)}" → "${reply.slice(0,55)}"`);
        return res.json({ success: true, reply, action, source: 'gemini' });
      } catch (err) {
        const is429 = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('exceeded');
        console.warn(`[VoiceAI] Gemini ${is429 ? '429 — quota' : 'error'}: ${err.message?.slice(0, 60)} — using local NLP`);

        // For quota errors, return a specific message and skip local NLP to save confusion
        if (is429) {
          const { reply, action } = localNLP(userMessage, ctx);
          return res.json({ success: true, reply, action, source: 'local' });
        }
      }
    }

    // ── Local NLP (fallback, always accurate with live data) ─────────────
    const { reply, action } = localNLP(userMessage, ctx);
    console.log(`🤖 [VoiceAI/local] "${userMessage.slice(0,30)}" → "${reply.slice(0,55)}"`);
    res.json({ success: true, reply, action, source: 'local' });

  } catch (err) {
    console.error('[VoiceAI] Error:', err.message);
    res.json({ success: true, reply: "Something went wrong — try asking about your wallet or tickets!", action: null });
  }
};
