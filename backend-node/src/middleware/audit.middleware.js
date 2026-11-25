const AuditLog = require('../models/AuditLog.model');

/**
 * Global Audit Middleware
 * Intercepts POST, PUT, PATCH, and DELETE requests and asynchronously logs them.
 */
const auditMiddleware = (req, res, next) => {
  // Only audit modifying actions
  const auditableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (auditableMethods.includes(req.method)) {
    // Capture the original send/json function
    const originalSend = res.send;
    const originalJson = res.json;

    // Override res.send to capture response data
    res.send = function (body) {
      logAudit(req, res, body);
      return originalSend.apply(this, arguments);
    };

    // Override res.json to capture response data
    res.json = function (body) {
      logAudit(req, res, body);
      return originalJson.apply(this, arguments);
    };
  }

  next();
};

// Any key that looks like a credential is redacted, at any depth.
// (The old list missed newPassword/currentPassword, which were stored in clear,
// and login responses' JWTs were stored too.)
const SENSITIVE_KEY = /password|secret|token|signature|credential|authorization|^otp$|^code$|^pin$/i;
const redact = (value, depth = 0) => {
  if (depth > 5 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = SENSITIVE_KEY.test(k) ? '***' : redact(v, depth + 1);
  }
  return out;
};

const logAudit = async (req, res, responseBody) => {
  // Avoid re-logging if already done (in case both send and json are called)
  if (res.locals.audited) return;
  res.locals.audited = true;

  try {
    let parsedResponse = responseBody;
    if (typeof responseBody === 'string') {
      try {
        parsedResponse = JSON.parse(responseBody);
      } catch (e) {
        // Not a JSON string, keep as is
      }
    }

    // Clean sensitive data from request body (e.g. passwords)
    const requestData = redact({ ...(req.body || {}) });
    parsedResponse = redact(parsedResponse);

    await AuditLog.create({
      // If user is not logged in yet (e.g. login route), userId might be null, 
      // but AuditLog requires a userId. For public routes, we might need a fallback or bypass.
      // Let's use a dummy System ID or only log if req.user exists.
      userId: req.user ? req.user._id : null,
      action: `${req.method} ${req.originalUrl}`,
      requestData,
      responseData: parsedResponse
    });
  } catch (err) {
    // We swallow errors here so that auditing failures don't crash the API response
    console.error('Audit Log Error:', err.message);
  }
};

module.exports = auditMiddleware;
