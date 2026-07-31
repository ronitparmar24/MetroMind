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
}

/**
 * Send a 6-digit OTP verification email
 * @param {string} toEmail - Recipient email
 * @param {string} otp - Plain 6-digit OTP code
 */
const sendOTPEmail = async (toEmail, otp) => {
  if (!transporter) {
    console.warn('⚠️  Email not configured — OTP for', toEmail, 'is:', otp);
    return; // Graceful fallback: log OTP to console in dev
  }

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
};
/**
 * Send a login notification email
 * @param {string} toEmail - Recipient email
 * @param {string} userName - User's display name
 * @param {string} method - Login method ('password', 'google')
 */
const sendLoginNotificationEmail = async (toEmail, userName, method = 'password') => {
  if (!transporter) return; // Skip in dev if email isn't configured

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
  } catch (err) {
    // Don't let email failures break login
    console.error('Failed to send login notification email:', err.message);
  }
};

module.exports = { sendOTPEmail, sendLoginNotificationEmail };
