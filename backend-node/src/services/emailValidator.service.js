// backend-node/src/services/emailValidator.service.js
// Validates email addresses before OTP is sent.
//
// Two-layer approach:
//  1. Local blocklist — instant, zero latency, catches the most common
//     disposable domains reliably even when AbstractAPI is slow/down.
//  2. AbstractAPI — catches less-known disposable domains & true
//     undeliverability. Fail-open: a timeout or error never blocks signup.

const axios = require('axios');

// ── Common disposable / temp-mail domains ────────────────────────────────────
// Extended list covering the most widely used throwaway mail services.
const DISPOSABLE_DOMAINS = new Set([
  'mailnull.com', 'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz',
  'guerrillamail.de', 'guerrillamail.net', 'guerrillamail.org', 'sharklasers.com',
  'guerrillamailblock.com', 'grr.la', 'spam4.me', 'trashmail.com', 'trashmail.me',
  'trashmail.net', 'trashmail.at', 'trashmail.io', 'trashmail.xyz',
  'mailinator.com', 'maildrop.cc', 'yopmail.com', 'yopmail.fr', 'cool.fr.nf',
  'jetable.fr.nf', 'nospam.ze.tc', 'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr',
  'courriel.fr.nf', 'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
  'tempmail.com', 'temp-mail.org', 'tempinbox.com', 'tempr.email',
  'throwam.com', 'throwaway.email', 'dispostable.com', 'sharklasers.com',
  'fakeinbox.com', 'mailnesia.com', 'mailnull.com', 'spamgourmet.com',
  'spamgourmet.net', 'spamgourmet.org', 'spamfree24.org', 'spamfree24.de',
  'spamfree24.eu', 'spamfree24.info', 'spamfree24.net', 'spamex.com',
  'discard.email', 'discardmail.com', 'discardmail.de', 'spamspot.com',
  'spamspot.net', 'spamspot.org', 'spamspot.info', 'kasmail.com', 'spammotel.com',
  'e4ward.com', 'mailexpire.com', 'filzmail.com', '33mail.com', 'cheatmail.de',
  'mail.mezimages.net', 'spamfree.eu', 'mailnew.com', 'mail2rss.org',
  'humaility.com', 'proxymail.eu', 'rcpt.at', 'spamgob.com', 'deadaddress.com',
  'mailscrap.com', 'jetable.net', 'jetable.org', 'jetable.com', 'jetable.fr',
  'mailnull.com', 'objectmail.com', 'pookmail.com', 'smellfear.com', 'hmamail.com',
  'throwam.com', 'fakemail.net', 'mytempemail.com', 'byom.de', 'spamgourmet.com',
  'anonaddy.com', 'maildrop.cc', 'inboxkitten.com', 'getnada.com', 'harakirimail.com',
  'cocovpn.com', 'spamfree24.net', 'spamfree24.eu', 'spamfree24.de', 'spamfree24.org',
]);

/**
 * Validate an email using local blocklist + AbstractAPI.
 * @param {string} email
 * @returns {Promise<{ isValid: boolean, isDisposable: boolean, reason: string }>}
 */
exports.validateEmail = async (email) => {
  const domain = email.split('@')[1]?.toLowerCase();

  // ── Layer 1: instant local blocklist check ───────────────────────────────
  if (domain && DISPOSABLE_DOMAINS.has(domain)) {
    return { isValid: false, isDisposable: true, reason: 'DISPOSABLE_LOCAL' };
  }

  // ── Layer 2: AbstractAPI (async, fail-open) ──────────────────────────────
  try {
    const { data } = await axios.get(
      'https://emailvalidation.abstractapi.com/v1/',
      {
        params: {
          api_key: process.env.ABSTRACT_EMAIL_API_KEY,
          email,
        },
        timeout: 6000,
      }
    );

    const isValidFormat  = data?.is_valid_format?.value   ?? true;
    const isDisposable   = data?.is_disposable_email?.value ?? false;
    const deliverability = data?.deliverability ?? 'UNKNOWN';
    const isDeliverable  = deliverability !== 'UNDELIVERABLE';

    return {
      isValid:      isValidFormat && isDeliverable,
      isDisposable: isDisposable,
      reason:       deliverability,
    };
  } catch (err) {
    // Fail open — a slow/down external API must never block real signups
    console.warn('[emailValidator] AbstractAPI call failed (fail-open):', err.message);
    return { isValid: true, isDisposable: false, reason: 'API_UNAVAILABLE' };
  }
};
