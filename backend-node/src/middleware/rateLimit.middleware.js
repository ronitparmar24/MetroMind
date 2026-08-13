// backend-node/src/middleware/rateLimit.middleware.js
//
// Global rate limiter: 10 000 requests per 15-minute window per IP.
//
// Store (upgraded from in-memory to Upstash Redis):
//   Uses rate-limit-redis which implements the express-rate-limit store
//   interface. The sendCommand bridge maps rate-limit-redis's raw Redis
//   command calls to Upstash's HTTP-based REST client methods.
//
// Why Redis-backed rate limiting?
//   • In-memory store resets on every server restart — a deploy lifts the
//     limit for abusive IPs.
//   • With multiple serverless instances (Vercel), each instance has its own
//     in-memory counter; an attacker could hit 10 000 × N instances per window.
//   • Redis gives a single, shared, crash-safe counter across all instances.
//   • Rate limit state persists across deploys — no grace period for attackers.
//
// Graceful degradation: if Redis credentials are missing, we use the
// express-rate-limit default in-memory store — the app remains functional
// (no crash), just without cross-instance coordination.

const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { Redis } = require('@upstash/redis');

const url   = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let limiter;

if (url && token) {
  const redisClient = new Redis({ url, token });

  // rate-limit-redis expects a sendCommand(cmd, ...args) async function.
  // Upstash's REST client doesn't expose sendCommand directly, so we route
  // the specific commands that rate-limit-redis uses through native methods.
  const sendCommand = async (command, ...args) => {
    const cmd = command.toUpperCase();
    switch (cmd) {
      case 'GET':    return redisClient.get(args[0]);
      case 'SET':    return redisClient.set(args[0], args[1]);
      case 'INCR':   return redisClient.incr(args[0]);
      case 'DECR':   return redisClient.decr(args[0]);
      case 'DEL':    return redisClient.del(args[0]);
      case 'EXPIRE': return redisClient.expire(args[0], parseInt(args[1], 10));
      case 'PEXPIRE':return redisClient.pexpire(args[0], parseInt(args[1], 10));
      case 'TTL':    return redisClient.ttl(args[0]);
      case 'PTTL':   return redisClient.pttl(args[0]);
      // EVALSHA / EVAL: rate-limit-redis uses a Lua script for atomic increment
      case 'EVALSHA':
      case 'EVAL': {
        // args: [script/sha, numkeys, ...keys, ...argv]
        const script = args[0];
        const numkeys = parseInt(args[1], 10);
        const keys = args.slice(2, 2 + numkeys);
        const argv = args.slice(2 + numkeys);
        return redisClient.eval(script, { keys, arguments: argv });
      }
      // SCRIPT LOAD: cache a Lua script and return its SHA
      case 'SCRIPT': {
        if (args[0]?.toUpperCase() === 'LOAD') {
          const result = await redisClient.scriptLoad(args[1]);
          return result;
        }
        throw new Error(`Unsupported SCRIPT subcommand: ${args[0]}`);
      }
      default:
        throw new Error(`Unsupported Redis command in rate limiter: ${cmd}`);
    }
  };

  const store = new RedisStore({ sendCommand });

  limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    store,
  });

  console.log('[RateLimit] Redis-backed rate limiting active ✅');
} else {
  // No Redis credentials — in-memory fallback (local dev)
  console.warn('[RateLimit] No Redis credentials — using in-memory rate limit store (local dev).');
  limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

module.exports = { limiter };
