const axios = require('axios');

/**
 * Validate a phone number using AbstractAPI.
 * Assumes an Indian mobile number (+91).
 * @param {string} phone
 * @returns {Promise<{ isValid: boolean, carrier: string, lineType: string }>}
 */
exports.validatePhone = async (phone) => {
  try {
    const { data } = await axios.get(
      'https://phonevalidation.abstractapi.com/v1/',
      { params: { api_key: process.env.ABSTRACT_PHONE_API_KEY, phone: `+91${phone}` } }
    );
    return { isValid: data.valid, carrier: data.carrier, lineType: data.type };
  } catch (err) {
    console.warn('[phoneValidator] AbstractAPI call failed (fail-open):', err.message);
    return { isValid: true }; // fail open
  }
};
