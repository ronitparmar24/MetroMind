const axios = require('axios');

/**
 * reCAPTCHA v3 is enforced only when:
 *   - a secret key is configured, AND
 *   - we are running in production (or RECAPTCHA_ENFORCE=true is set).
 *
 * Google rejects `localhost` for site keys unless it is explicitly added to the
 * key's allowed domains, which makes every local login/register fail with a
 * "browser-error" token. Skipping verification in development keeps local work
 * unblocked while production stays protected.
 */
const isRecaptchaEnforced = () => {
  if (!process.env.RECAPTCHA_SECRET_KEY) return false;
  if (process.env.RECAPTCHA_ENFORCE === 'true') return true;
  if (process.env.RECAPTCHA_ENFORCE === 'false') return false;
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
};

const MIN_SCORE = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);

exports.verifyRecaptcha = async (token) => {
  try {
    const { data } = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      { params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: token }, timeout: 8000 }
    );
    if (!data.success) {
      console.warn('reCAPTCHA rejected token:', data['error-codes']);
    }
    return { success: data.success, score: data.score, errorCodes: data['error-codes'] || [] };
  } catch (err) {
    console.error('Recaptcha verify failed', err.message);
    return { success: false, score: 0, errorCodes: ['network-error'] };
  }
};

/**
 * Returns { ok: true } when the request may proceed, or
 * { ok: false, message } with a user-facing reason when it must be blocked.
 */
exports.checkRecaptcha = async (token) => {
  if (!isRecaptchaEnforced()) return { ok: true, skipped: true };

  if (!token) {
    return {
      ok: false,
      message: 'Security check could not load. Please disable ad/tracker blockers for this site and refresh the page.',
    };
  }

  const result = await exports.verifyRecaptcha(token);
  // v3 keys return a score; v2 keys don't — treat a missing score as a pass.
  const scoreOk = typeof result.score !== 'number' || result.score >= MIN_SCORE;
  if (!result.success || !scoreOk) {
    return { ok: false, message: 'Suspicious activity detected, please refresh the page and try again' };
  }
  return { ok: true };
};

exports.isRecaptchaEnforced = isRecaptchaEnforced;

exports.getIpLocation = async (ip) => {
  try {
    const { data } = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 4000 });
    if (data.status !== 'success') return null;
    return { city: data.city, region: data.regionName, country: data.country };
  } catch (err) {
    return null;
  }
};
