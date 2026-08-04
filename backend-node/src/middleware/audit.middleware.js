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
    const requestData = { ...req.body };
    if (requestData.password) requestData.password = '***';
    if (requestData.token) requestData.token = '***';
    if (requestData.otp) requestData.otp = '***';

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
