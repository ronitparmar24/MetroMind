// backend-node/src/utils/pdfReport.js
// Carbon Passport PDF — full-page professional report with an embedded
// Chart.js line chart (rendered server-side via QuickChart.io).

const PDFDocument    = require('pdfkit');
const { generateChartImage } = require('../services/chartImage.service');

// Month abbreviations for chart labels
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Build a Chart.js config from monthly CO2 data.
 * @param {Array<{month: string, co2: number}>} monthlyData  e.g. [{month:'2026-02', co2:1.8}, ...]
 */
function buildCO2ChartConfig(monthlyData) {
  const labels = monthlyData.map(d => {
    const [year, month] = d.month.split('-');
    return `${MONTH_ABBR[parseInt(month, 10) - 1]} ${year.slice(2)}`;
  });
  const data = monthlyData.map(d => parseFloat(d.co2.toFixed(3)));

  return {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'CO₂ Saved (kg)',
        data,
        fill: true,
        backgroundColor: 'rgba(34,197,94,0.15)',
        borderColor: '#16a34a',
        borderWidth: 2.5,
        pointBackgroundColor: '#16a34a',
        pointRadius: 5,
        tension: 0.4,
      }],
    },
    options: {
      plugins: {
        legend: { display: true, position: 'top', labels: { font: { size: 13 } } },
        title: { display: false },
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => `${v} kg` },
        },
      },
    },
  };
}

/**
 * Generate a full Carbon Passport PDF and return it as a Buffer.
 *
 * @param {Object} params
 * @param {Object}   params.user           User document (name, email)
 * @param {number}   params.totalCO2       Total lifetime CO2 saved (kg)
 * @param {number}   params.totalDistance  Total lifetime distance (km)
 * @param {number}   params.totalTrips     Total trip count
 * @param {number}   params.treesEquivalent  CO2 / 21
 * @param {Array}    params.monthlyData    [{month, co2}, ...] last 6 months
 * @returns {Promise<Buffer>}
 */
const generateCarbonPassportPDF = async ({ user, totalCO2, totalDistance, totalTrips, treesEquivalent, monthlyData }) => {
  // ── 1. Fetch chart image from QuickChart.io ─────────────────
  let chartBuffer = null;
  try {
    const chartConfig = buildCO2ChartConfig(monthlyData.length ? monthlyData : [{ month: new Date().toISOString().slice(0,7), co2: 0 }]);
    chartBuffer = await generateChartImage(chartConfig, 500, 260);
  } catch (err) {
    // Non-fatal — PDF renders without chart
    console.warn('[pdfReport] QuickChart fetch failed, skipping chart:', err.message);
  }

  // ── 2. Build PDF ────────────────────────────────────────────
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end',  ()    => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const W = doc.page.width - 100; // usable width (margin 50 each side)

    // ── Header banner ──────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 120).fill('#16a34a');
    doc.fillColor('white')
       .fontSize(26).font('Helvetica-Bold')
       .text('MetroMind', 50, 30, { align: 'left' });
    doc.fontSize(13).font('Helvetica')
       .text('Carbon Passport — Environmental Impact Report', 50, 62, { align: 'left' });
    doc.fontSize(10)
       .text(`Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, 50, 84);
    doc.moveDown(5);

    // ── Passport card ──────────────────────────────────────────
    const cardY = 140;
    doc.roundedRect(50, cardY, W, 110, 12)
       .fillAndStroke('rgba(240,253,244,1)', '#bbf7d0');

    doc.fillColor('#15803d').fontSize(14).font('Helvetica-Bold')
       .text('🌍  Eco Warrior Card', 70, cardY + 16);
    doc.fillColor('#166534').fontSize(11).font('Helvetica')
       .text(`Name: ${user.name || 'N/A'}`, 70, cardY + 38)
       .text(`Email: ${user.email || 'N/A'}`, 70, cardY + 54);

    // Stat pills inside card
    const pillData = [
      { label: 'CO₂ Saved',  value: `${totalCO2.toFixed(1)} kg` },
      { label: 'km by Metro', value: `${totalDistance.toFixed(0)} km` },
      { label: 'Total Rides', value: totalTrips },
      { label: '🌳 Trees Eq.', value: treesEquivalent },
    ];
    let pillX = 70;
    const pillY = cardY + 76;
    pillData.forEach(({ label, value }) => {
      doc.roundedRect(pillX, pillY, 105, 28, 6).fill('#dcfce7');
      doc.fillColor('#15803d').fontSize(8).font('Helvetica-Bold')
         .text(label, pillX + 6, pillY + 4, { width: 93 });
      doc.fontSize(11).font('Helvetica-Bold')
         .text(String(value), pillX + 6, pillY + 14, { width: 93 });
      pillX += 115;
    });

    // ── Section: CO2 Savings Chart ─────────────────────────────
    const chartSectionY = cardY + 135;
    doc.fillColor('#1f2937').fontSize(13).font('Helvetica-Bold')
       .text('Monthly CO₂ Savings (Last 6 Months)', 50, chartSectionY);

    doc.moveTo(50, chartSectionY + 18).lineTo(50 + W, chartSectionY + 18)
       .strokeColor('#e5e7eb').lineWidth(1).stroke();

    if (chartBuffer) {
      doc.image(chartBuffer, 50, chartSectionY + 26, { width: W, height: Math.round(W * 0.52) });
    } else {
      doc.fillColor('#9ca3af').fontSize(10).font('Helvetica')
         .text('[Chart unavailable — check your internet connection]', 50, chartSectionY + 50);
    }

    const afterChartY = chartSectionY + 26 + (chartBuffer ? Math.round(W * 0.52) + 16 : 60);

    // ── Section: Impact Summary ────────────────────────────────
    doc.fillColor('#1f2937').fontSize(13).font('Helvetica-Bold')
       .text('Your Environmental Impact', 50, afterChartY);
    doc.moveTo(50, afterChartY + 18).lineTo(50 + W, afterChartY + 18)
       .strokeColor('#e5e7eb').lineWidth(1).stroke();

    const rows = [
      ['Total CO₂ Saved',      `${totalCO2.toFixed(2)} kg`,            'Compared to private car travel'],
      ['Total Green Distance',  `${totalDistance.toFixed(1)} km`,        'Metro is ~80% cleaner than a car'],
      ['Trees Equivalent',      `${treesEquivalent} trees / year`,       '~21 kg CO₂ absorbed per tree annually'],
      ['Total Green Rides',     `${totalTrips} trips`,                   'Every ride counts!'],
    ];

    let rowY = afterChartY + 28;
    rows.forEach(([label, value, note], i) => {
      if (i % 2 === 0) {
        doc.rect(50, rowY, W, 24).fill('#f9fafb');
      }
      doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold')
         .text(label, 58, rowY + 7, { width: 160 });
      doc.fillColor('#15803d').font('Helvetica-Bold')
         .text(value, 220, rowY + 7, { width: 130 });
      doc.fillColor('#6b7280').font('Helvetica')
         .text(note, 355, rowY + 7, { width: W - 305 });
      rowY += 24;
    });

    // ── Footer ─────────────────────────────────────────────────
    doc.moveTo(50, doc.page.height - 60).lineTo(50 + W, doc.page.height - 60)
       .strokeColor('#d1d5db').lineWidth(0.5).stroke();
    doc.fillColor('#9ca3af').fontSize(8).font('Helvetica')
       .text(
         'MetroMind · Gujarat Metro Rail Corporation (GMRC) · This certificate is digitally generated.',
         50, doc.page.height - 48, { align: 'center', width: W },
       );

    doc.end();
  });
};

module.exports = { generateCarbonPassportPDF };
