const axios = require('axios');
const crypto = require('crypto');

exports.checkPasswordPwned = async (password) => {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  try {
    const { data } = await axios.get(
      `https://api.pwnedpasswords.com/range/${prefix}`
    );
    const match = data.split('\n').find(line => line.startsWith(suffix));
    if (match) {
      const count = parseInt(match.split(':')[1]);
      return { isPwned: true, breachCount: count };
    }
    return { isPwned: false };
  } catch (err) {
    return { isPwned: false }; // fail open, never block signup if API is down
  }
};
