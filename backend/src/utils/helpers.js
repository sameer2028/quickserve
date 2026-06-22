const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// ─── Generate Invoice PDF ─────────────────────────────────
const generateInvoice = async (order, restaurant, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const fileName = `invoice-${order.orderNumber}.pdf`;
      const filePath = path.join(__dirname, '../../uploads/invoices', fileName);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#667eea')
        .text('QuickServe', 50, 50);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666')
        .text('Restaurant Pre-Ordering Platform', 50, 78);

      // Invoice title
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#333')
        .text('INVOICE', 400, 50, { align: 'right' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666')
        .text(`#${order.orderNumber}`, 400, 75, { align: 'right' })
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 90, { align: 'right' });

      // Divider
      doc.moveTo(50, 120).lineTo(550, 120).strokeColor('#ddd').stroke();

      // Restaurant & Customer details
      let y = 140;
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text('From:', 50, y);
      doc.fontSize(10).font('Helvetica').fillColor('#555');
      doc.text(restaurant.name, 50, y + 18);
      doc.text(restaurant.address?.street || '', 50, y + 33);
      doc.text(`${restaurant.address?.city || ''}, ${restaurant.address?.state || ''}`, 50, y + 48);
      doc.text(`Phone: ${restaurant.phone}`, 50, y + 63);

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text('To:', 350, y);
      doc.fontSize(10).font('Helvetica').fillColor('#555');
      doc.text(user.name, 350, y + 18);
      doc.text(user.email, 350, y + 33);
      doc.text(`Phone: ${user.phone || 'N/A'}`, 350, y + 48);

      // Items table
      y = 260;
      doc.moveTo(50, y).lineTo(550, y).strokeColor('#667eea').lineWidth(2).stroke();

      y += 10;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333');
      doc.text('Item', 50, y);
      doc.text('Qty', 320, y, { width: 50, align: 'center' });
      doc.text('Price', 380, y, { width: 80, align: 'right' });
      doc.text('Total', 470, y, { width: 80, align: 'right' });

      y += 20;
      doc.moveTo(50, y).lineTo(550, y).strokeColor('#ddd').lineWidth(1).stroke();

      // Item rows
      doc.font('Helvetica').fillColor('#555');
      for (const item of order.items) {
        y += 15;
        doc.text(item.name, 50, y, { width: 260 });
        doc.text(item.quantity.toString(), 320, y, { width: 50, align: 'center' });
        doc.text(`₹${item.price.toFixed(2)}`, 380, y, { width: 80, align: 'right' });
        doc.text(`₹${item.itemTotal.toFixed(2)}`, 470, y, { width: 80, align: 'right' });

        if (item.variant?.name) {
          y += 13;
          doc.fontSize(8).fillColor('#888').text(`  Variant: ${item.variant.name}`, 60, y);
          doc.fontSize(10).fillColor('#555');
        }
      }

      // Totals section
      y += 30;
      doc.moveTo(350, y).lineTo(550, y).strokeColor('#ddd').stroke();

      y += 15;
      doc.font('Helvetica').fillColor('#555');
      doc.text('Subtotal:', 350, y);
      doc.text(`₹${order.pricing.subtotal.toFixed(2)}`, 470, y, { width: 80, align: 'right' });

      if (order.pricing.tax > 0) {
        y += 18;
        doc.text('Tax:', 350, y);
        doc.text(`₹${order.pricing.tax.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
      }

      if (order.pricing.deliveryFee > 0) {
        y += 18;
        doc.text('Delivery Fee:', 350, y);
        doc.text(`₹${order.pricing.deliveryFee.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
      }

      if (order.pricing.packagingCharge > 0) {
        y += 18;
        doc.text('Packaging:', 350, y);
        doc.text(`₹${order.pricing.packagingCharge.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
      }

      if (order.pricing.couponDiscount > 0) {
        y += 18;
        doc.fillColor('#11998e');
        doc.text('Coupon Discount:', 350, y);
        doc.text(`-₹${order.pricing.couponDiscount.toFixed(2)}`, 470, y, { width: 80, align: 'right' });
        doc.fillColor('#555');
      }

      y += 25;
      doc.moveTo(350, y).lineTo(550, y).strokeColor('#667eea').lineWidth(2).stroke();

      y += 12;
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#333');
      doc.text('Total:', 350, y);
      doc.text(`₹${order.pricing.total.toFixed(2)}`, 470, y, { width: 80, align: 'right' });

      // Footer
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#999')
        .text('Thank you for ordering with QuickServe!', 50, 750, { align: 'center' })
        .text('This is a computer-generated invoice.', 50, 765, { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        resolve({ filePath, fileName });
      });

      writeStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// ─── Generate QR Code ─────────────────────────────────────
const generateQRCode = async (data) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#333333',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR Code generation failed:', error.message);
    throw error;
  }
};

module.exports = { generateInvoice, generateQRCode };
