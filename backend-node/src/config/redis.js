// backend-node/src/config/redis.js
//
// Singleton Upstash Redis client — imported once, reused everywhere.
//
// Upstash Redis is an HTTP-based Redis-compatible store (REST API under the
// hood), so there is no persistent TCP connection to manage.  Each operation
// is an independent HTTPS call, which is ideal for serverless runtimes
// (Vercel, AWS Lambda) that don't support long-lived socket connections.
//
// Environment variables required:
//   UPSTASH_REDIS_REST_URL   — e.g. https://lasting-mayfly-104791.upstash.io
//   UPSTASH_REDIS_REST_TOKEN — the bearer token from the Upstash console
//
// If either variable is absent (local dev without a Redis instance), we
// return a no-op stub so every cache miss simply triggers a live fetch —
// the app still works correctly, just without caching.

const { Redis } = require('@upstash/redis');

const url   = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis;

if (url && token) {
  redis = new Redis({ url, token });
  console.log('[Redis] Upstash Redis client initialised ✅');
} else {
  // No-op stub — every get() returns null (cache miss), set/del are silent no-ops.
  // This keeps local dev working without requiring a Redis instance.
  console.warn('[Redis] UPSTASH_REDIS_REST_URL / TOKEN not set — using no-op cache stub (local dev).');
  redis = {
    get:    async () => null,
    set:    async () => null,
    del:    async () => null,
    exists: async () => 0,
  };
}

module.exports = redis;
