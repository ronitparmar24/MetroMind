// backend-node/src/utils/pdfTicket.js
// PDF ticket generation using pdfkit
// Generates a downloadable PDF with ticket details and QR codes.
// For group bookings, each passenger gets their own page with individual QR.

const PDFDocument = require('pdfkit');

/**
 * Generate a PDF ticket and return it as a buffer.
 * Supports multi-passenger group tickets with one QR block per page.
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

    const passengerCount = ticket.passengers?.length || 1;
    const isGroup = passengerCount > 1;
    const farePerPerson = isGroup
      ? Math.round(ticket.fare / passengerCount)
      : ticket.fare;

    ticket.passengers.forEach((passenger, idx) => {
      // Add new page for subsequent passengers
      if (idx > 0) doc.addPage();

      // ── Header ──
      doc.fontSize(20).font('Helvetica-Bold').text('MetroMind', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Gujarat Metro Rail Corporation', { align: 'center' });
      doc.moveDown(0.5);

      // Group booking banner
      if (isGroup) {
        doc.fontSize(9).font('Helvetica-Bold')
          .text(`GROUP TICKET — Passenger ${idx + 1} of ${passengerCount}`, { align: 'center' });
        doc.moveDown(0.3);
      }

      // Divider
      doc.moveTo(40, doc.y).lineTo(360, doc.y).stroke('#cccccc');
      doc.moveDown();

      // ── Ticket details ──
      doc.fontSize(12).font('Helvetica-Bold').text(`Ticket ID: ${ticket.ticketId}`);
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`From: ${ticket.source}`);
      doc.text(`To: ${ticket.destination}`);
      doc.text(`Date: ${new Date(ticket.travelDate).toLocaleDateString('en-IN')}`);
      doc.text(`Time: ${ticket.travelTime}`);
      doc.text(`Distance: ${ticket.distance} km`);
      doc.text(`Crowd Level: ${ticket.crowdBucket}`);
      doc.text(`CO2 Saved: ${ticket.co2Saved} kg`);
      doc.text(`Status: ${ticket.status.toUpperCase()}`);
      doc.moveDown(0.5);

      // ── Fare breakdown ──
      doc.moveTo(40, doc.y).lineTo(360, doc.y).stroke('#eeeeee');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold');
      if (isGroup) {
        doc.text(`Total Fare: Rs.${ticket.fare} (${passengerCount} passengers)`);
        doc.text(`This Passenger: Rs.${passenger.farePerPerson || farePerPerson}`);
      } else {
        doc.text(`Fare: Rs.${ticket.fare}`);
      }
      doc.moveDown();

      // ── Passenger info ──
      doc.fontSize(11).font('Helvetica-Bold').text('Passenger Details:');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${passenger.name}`);
      doc.text(`Age: ${passenger.age}`);
      doc.moveDown();

      // ── QR Code ──
      if (passenger.qrCode) {
        doc.fontSize(9).font('Helvetica').text('Scan QR at gate:', { align: 'center' });
        doc.moveDown(0.3);

        // QR codes are base64 data URIs — extract the raw base64
        const base64Data = passenger.qrCode.replace(/^data:image\/\w+;base64,/, '');
        try {
          const qrBuffer = Buffer.from(base64Data, 'base64');
          const qrX = (doc.page.width - 140) / 2; // center the 140px QR
          doc.image(qrBuffer, qrX, doc.y, { width: 140, height: 140 });
          doc.moveDown(8); // move past the QR image
        } catch {
          doc.fontSize(8).text('[QR code could not be embedded]', { align: 'center' });
          doc.moveDown();
        }
      }

      // ── Footer ──
      doc.fontSize(8).font('Helvetica')
        .text('This is a digital ticket. Show the QR code at the gate.', { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    });

    doc.end();
  });
};

module.exports = { generatePDFTicket };
