// backend-node/src/utils/emailer.js
// Sends OTP verification emails using Gmail SMTP via Nodemailer
const nodemailer = require('nodemailer');
const { EMAIL_USER, EMAIL_APP_PASSWORD } = require('../config/env');

let transporter = null;

if (EMAIL_USER && EMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD },
  });
  // Verify SMTP connection at startup
  transporter.verify((err) => {
    if (err) {
      console.error('❌ Email SMTP connection failed:', err.message);
      transporter = null; // disable so errors don't silently swallow
    } else {
      console.log('✅ Email SMTP ready — sending from:', EMAIL_USER);
    }
  });
} else {
  console.warn('⚠️  Email not configured (EMAIL_USER / EMAIL_APP_PASSWORD missing) — emails will be logged to console only');
}

/**
 * Utility to prevent sending emails to mock domains used in testing or demo.
 */
const isTestEmail = (email) => {
  const lowerEmail = email.toLowerCase();
  return lowerEmail.endsWith('@metromind.com') || lowerEmail.endsWith('@metromind.in') || lowerEmail.endsWith('@example.com');
};

/**
 * Send a 6-digit OTP verification email
 * @param {string} toEmail - Recipient email
 * @param {string} otp - Plain 6-digit OTP code
 */
const sendOTPEmail = async (toEmail, otp) => {
  if (!transporter) {
    console.warn('⚠️  [OTP Email] Not configured — OTP for', toEmail, 'is:', otp);
    return;
  }
  
  if (isTestEmail(toEmail)) {
    console.log(`⚠️  [OTP Email] Skipped for test domain: ${toEmail}. OTP is: ${otp}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"MetroMind" <${EMAIL_USER}>`,
      to: toEmail,
      subject: 'Verify your MetroMind account',
      html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:0">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:32px 24px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:white;font-size:24px;margin:0;letter-spacing:-0.5px">🚇 MetroMind</h1>
          <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:8px 0 0">Smart Metro Transit Platform</p>
        </div>

        <!-- Body -->
        <div style="background:#ffffff;padding:32px 24px;border:1px solid #e2e8f0;border-top:none">
          <h2 style="color:#0f172a;font-size:20px;margin:0 0 8px">Verify your email</h2>
          <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px">
            Enter this verification code to complete your MetroMind registration:
          </p>

          <!-- OTP Code -->
          <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px">
            <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:800;letter-spacing:8px;color:#4F46E5">
              ${otp}
            </span>
          </div>

          <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0">
            ⏱ This code expires in <strong>10 minutes</strong>.<br/>
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc;padding:16px 24px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;text-align:center">
          <p style="color:#94a3b8;font-size:11px;margin:0">
            © ${new Date().getFullYear()} MetroMind · Gujarat Metro Rail Corporation
          </p>
        </div>
      </div>
    `,
    });
    console.log('📧 [OTP] Sent to', toEmail);
  } catch (err) {
    console.error('❌ [OTP Email] Failed to send to', toEmail, ':', err.message);
    throw err; // Re-throw so caller can handle
  }
};
/**
 * Send a login notification email
 * @param {string} toEmail - Recipient email
 * @param {string} userName - User's display name
 * @param {string} method - Login method ('password', 'google')
 */
const sendLoginNotificationEmail = async (toEmail, userName, method = 'password') => {
  if (!transporter) {
    console.warn('⚠️  [Login Notification] Not configured — skipping email to', toEmail);
    return;
  }

  if (isTestEmail(toEmail)) {
    console.log(`⚠️  [Login Notification] Skipped for test domain: ${toEmail}`);
    return;
  }

  const now = new Date();
  const timeStr = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const methodLabel = method === 'google' ? 'Google Sign-In' : 'Email & Password';
  const methodIcon = method === 'google' ? '🔵' : '🔐';

  try {
    await transporter.sendMail({
      from: `"MetroMind Security" <${EMAIL_USER}>`,
      to: toEmail,
      subject: `✅ Login Successful — MetroMind`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:0">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#059669,#10b981);padding:28px 24px;border-radius:16px 16px 0 0;text-align:center">
            <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center">
              <span style="font-size:28px">✓</span>
            </div>
            <h1 style="color:white;font-size:22px;margin:0;letter-spacing:-0.5px">Login Successful</h1>
            <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:6px 0 0">Your MetroMind account was accessed</p>
          </div>

          <!-- Body -->
          <div style="background:#ffffff;padding:28px 24px;border:1px solid #e2e8f0;border-top:none">
            <p style="color:#0f172a;font-size:15px;margin:0 0 20px;line-height:1.5">
              Hi <strong>${userName}</strong>,<br/>
              We detected a successful sign-in to your MetroMind account.
            </p>

            <!-- Details Card -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:0;overflow:hidden;margin:0 0 20px">
              <div style="padding:14px 16px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center">
                <span style="font-size:16px;margin-right:10px">🕐</span>
                <div>
                  <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Time</div>
                  <div style="font-size:13px;color:#0f172a;font-weight:600;margin-top:2px">${timeStr}</div>
                </div>
              </div>
              <div style="padding:14px 16px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center">
                <span style="font-size:16px;margin-right:10px">${methodIcon}</span>
                <div>
                  <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Sign-in Method</div>
                  <div style="font-size:13px;color:#0f172a;font-weight:600;margin-top:2px">${methodLabel}</div>
                </div>
              </div>
              <div style="padding:14px 16px;display:flex;align-items:center">
                <span style="font-size:16px;margin-right:10px">📧</span>
                <div>
                  <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Account</div>
                  <div style="font-size:13px;color:#0f172a;font-weight:600;margin-top:2px">${toEmail}</div>
                </div>
              </div>
            </div>

            <!-- Security Notice -->
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin:0 0 16px">
              <p style="margin:0;font-size:12px;color:#92400e;line-height:1.5">
                <strong>🛡️ Wasn't you?</strong> If you didn't sign in, your account may be compromised.
                Change your password immediately and contact support.
              </p>
            </div>

            <p style="color:#94a3b8;font-size:11px;line-height:1.4;margin:0">
              This is an automated security notification from MetroMind.
              You're receiving this because you have login alerts enabled.
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f8fafc;padding:16px 24px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;text-align:center">
            <p style="color:#94a3b8;font-size:11px;margin:0">
              © ${new Date().getFullYear()} MetroMind · Gujarat Metro Rail Corporation
            </p>
          </div>
        </div>
      `,
    });
    console.log('📧 [Login Notification] Sent to', toEmail, '| method:', method);
  } catch (err) {
    console.error('❌ [Login Notification] Failed to send to', toEmail, ':', err.message);
  }
};

/**
 * Send a welcome email to a newly registered user
 * @param {string} toEmail - Recipient email
 * @param {string} userName - User's display name
 */
const sendWelcomeEmail = async (toEmail, userName) => {
  if (!transporter) {
    console.log('📧 [Welcome Email] Would send to:', toEmail, '— email not configured in dev');
    return;
  }

  if (isTestEmail(toEmail)) {
    console.log(`⚠️  [Welcome Email] Skipped for test domain: ${toEmail}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"MetroMind" <${EMAIL_USER}>`,
      to: toEmail,
      subject: `🎉 Welcome to MetroMind, ${userName}!`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:0">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:36px 28px;border-radius:16px 16px 0 0;text-align:center">
            <div style="font-size:44px;margin-bottom:12px">🚇</div>
            <h1 style="color:white;font-size:26px;margin:0 0 6px;letter-spacing:-0.5px;font-weight:800">Welcome aboard, ${userName}!</h1>
            <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0">Your MetroMind account is ready to go</p>
          </div>

          <!-- Welcome Bonus Banner -->
          <div style="background:linear-gradient(135deg,#f59e0b,#f97316);padding:18px 28px;text-align:center">
            <p style="color:white;font-size:15px;margin:0;font-weight:700">🎁 ₹500 welcome bonus has been added to your wallet!</p>
            <p style="color:rgba(255,255,255,0.85);font-size:12px;margin:4px 0 0">Start booking metro tickets right away</p>
          </div>

          <!-- Body -->
          <div style="background:#ffffff;padding:32px 28px;border:1px solid #e2e8f0;border-top:none">
            <p style="color:#0f172a;font-size:15px;margin:0 0 24px;line-height:1.6">
              Hi <strong>${userName}</strong>,<br/>
              Thank you for joining MetroMind — the smartest way to commute. Here's what you can do right now:
            </p>

            <!-- Feature List -->
            <div style="display:grid;gap:12px;margin:0 0 28px">
              ${[
                ['🎫', 'Book Tickets', 'Quick QR-code metro tickets for any route'],
                ['💳', 'Digital Wallet', 'Top up and pay instantly — ₹500 already loaded!'],
                ['🗺️', 'Journey Planner', 'Find the fastest route with live train times'],
                ['🌿', 'Carbon Passport', 'Track CO₂ you save every trip'],
                ['🏆', 'Achievements', 'Earn badges and loyalty points as you commute'],
              ].map(([icon, title, desc]) => `
                <div style="display:flex;align-items:flex-start;gap:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px">
                  <span style="font-size:22px;flex-shrink:0">${icon}</span>
                  <div>
                    <div style="font-weight:700;font-size:13px;color:#0f172a">${title}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:2px">${desc}</div>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin:0 0 24px">
              <a href="http://localhost:3000/dashboard"
                style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;
                text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;
                letter-spacing:0.2px">
                Go to Dashboard →
              </a>
            </div>

            <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0;text-align:center">
              Need help? Reply to this email or visit our support page.<br/>
              Happy commuting! 🚇
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f8fafc;padding:16px 28px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;text-align:center">
            <p style="color:#94a3b8;font-size:11px;margin:0">
              © ${new Date().getFullYear()} MetroMind · Gujarat Metro Rail Corporation<br/>
              You're receiving this because you created a MetroMind account.
            </p>
          </div>
        </div>
      `,
    });
    console.log('🎉 [Welcome Email] Sent to', toEmail);
  } catch (err) {
    console.error('❌ [Welcome Email] Failed to send to', toEmail, ':', err.message);
  }
};

module.exports = { sendOTPEmail, sendLoginNotificationEmail, sendWelcomeEmail };
