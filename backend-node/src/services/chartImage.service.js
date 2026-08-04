// backend-node/src/services/chartImage.service.js
// Calls QuickChart.io to render a Chart.js config server-side and
// returns the resulting PNG as a raw Buffer, ready to embed in pdfkit.

const axios = require('axios');

/**
 * Render a Chart.js config via QuickChart.io and return raw PNG bytes.
 * @param {Object} chartConfig  Standard Chart.js config object
 * @param {number} [width=500]
 * @param {number} [height=280]
 * @returns {Promise<Buffer>}   PNG image buffer
 */
exports.generateChartImage = async (chartConfig, width = 500, height = 280) => {
  const response = await axios.post(
    'https://quickchart.io/chart',
    {
      chart: chartConfig,
      width,
      height,
      backgroundColor: 'white',
      devicePixelRatio: 2, // retina-quality output
    },
    {
      responseType: 'arraybuffer',
      timeout: 15_000,
    }
  );
  return Buffer.from(response.data);
};
