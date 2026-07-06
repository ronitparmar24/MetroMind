// backend-node/src/utils/qrGenerator.js
// QR code generation for ticket passengers using the 'qrcode' npm package

const QRCode = require('qrcode');

/**
 * Generate a QR code as a base64 data URL.
 * @param {string} data - The data to encode (typically ticketId + passenger info)
 * @returns {Promise<string>} Base64 data URL of the QR code
 */
const generateQR = async (data) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR generation failed:', error);
    throw new Error('Failed to generate QR code');
  }
};

module.exports = { generateQR };
