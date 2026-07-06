// backend-node/src/utils/pdfTicket.js
// PDF ticket generation using pdfkit
// Generates a downloadable PDF with ticket details and QR codes

const PDFDocument = require('pdfkit');

/**
 * Generate a PDF ticket and return it as a buffer.
 * @param {Object} ticket - The ticket document from MongoDB
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePDFTicket = (ticket) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 40 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('MetroMind', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Gujarat Metro Rail Corporation', { align: 'center' });
    doc.moveDown();

    // Divider
    doc.moveTo(40, doc.y).lineTo(360, doc.y).stroke('#cccccc');
    doc.moveDown();

    // Ticket details
    doc.fontSize(12).font('Helvetica-Bold').text(`Ticket ID: ${ticket.ticketId}`);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`From: ${ticket.source}`);
    doc.text(`To: ${ticket.destination}`);
    doc.text(`Date: ${new Date(ticket.travelDate).toLocaleDateString('en-IN')}`);
    doc.text(`Time: ${ticket.travelTime}`);
    doc.text(`Fare: ₹${ticket.fare}`);
    doc.text(`Distance: ${ticket.distance} km`);
    doc.text(`Crowd Level: ${ticket.crowdBucket}`);
    doc.text(`CO₂ Saved: ${ticket.co2Saved} kg`);
    doc.text(`Status: ${ticket.status.toUpperCase()}`);
    doc.moveDown();

    // Passengers
    doc.fontSize(12).font('Helvetica-Bold').text('Passengers:');
    doc.fontSize(10).font('Helvetica');
    ticket.passengers.forEach((p, i) => {
      doc.text(`  ${i + 1}. ${p.name} (Age: ${p.age})`);
    });
    doc.moveDown();

    // Footer
    doc.fontSize(8).text('This is a digital ticket. Show the QR code at the gate.', { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

    doc.end();
  });
};

module.exports = { generatePDFTicket };
