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
      'https://phoneintelligence.abstractapi.com/v1/',
      { params: { api_key: process.env.ABSTRACT_PHONE_API_KEY, phone: `+91${phone}` } }
    );
    
    return { 
      isValid: data.phone_validation?.is_valid, 
      carrier: data.phone_carrier?.name, 
      lineType: data.phone_carrier?.line_type 
    };
  } catch (err) {
    console.warn('[phoneValidator] AbstractAPI call failed (fail-open):', err.message);
    return { isValid: true }; // fail open
  }
};
