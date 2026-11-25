// backend-node/src/config/ai.js
// Single place for AI model names. Providers retire models regularly
// (gemini-2.0-flash and llama-3.3-70b-versatile both started returning 404),
// so defaults use rolling aliases where possible and can be overridden with
// GEMINI_MODEL / GROQ_MODEL env vars without a code change.

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

// Reasoning models (gpt-oss, qwen) spend tokens "thinking" before answering;
// keep that short and leave headroom so replies aren't cut off.
const isReasoningGroqModel = (model = GROQ_MODEL) => /gpt-oss|qwen/i.test(model);

const groqRequestOptions = (maxTokens) =>
  isReasoningGroqModel()
    ? { reasoning_effort: 'low', max_tokens: Math.max(maxTokens * 3, 600) }
    : { max_tokens: maxTokens };

module.exports = { GEMINI_MODEL, GROQ_MODEL, groqRequestOptions };
