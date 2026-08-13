const axios = require('axios');

exports.verifyRecaptcha = async (token) => {
  try {
    const { data } = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      { params: { secret: process.env.RECAPTCHA_SECRET_KEY, response: token } }
    );
    return { success: data.success, score: data.score };
  } catch (err) {
    console.error('Recaptcha verify failed', err.message);
    return { success: false, score: 0 };
  }
};

exports.getIpLocation = async (ip) => {
  try {
    const { data } = await axios.get(`http://ip-api.com/json/${ip}`);
    if (data.status !== 'success') return null;
    return { city: data.city, region: data.regionName, country: data.country };
  } catch (err) {
    return null;
  }
};
