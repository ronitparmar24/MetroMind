require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Testing key:", key ? key.slice(0, 5) + "..." : "undefined");
  const ai = new GoogleGenerativeAI(key);
  try {
    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const res = await model.generateContent('Say hello in 1 word');
    console.log("Success:", res.response.text());
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
