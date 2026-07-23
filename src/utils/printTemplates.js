import { formatCurrency } from './bookingUtils';

/**
 * Opens a print window with professional HTML content for Booking Confirmation
 * @param {Object} booking 
 */
export const printBookingConfirmation = (booking) => {
  if (!booking) return;

  const printWindow = window.open('', '_blank', 'width=850,height=700');
  if (!printWindow) {
    alert('Please allow popups to print documents.');
    return;
  }

  const remaining = Math.max(0, (booking.amount || 0) - (booking.paidAmount || 0));

  const passengersHtml = (booking.passengers || []).map((p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${p.name || 'Traveler'}</strong></td>
      <td>${p.age || '-'} / ${p.gender || '-'}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Booking Confirmation - ${booking.id}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #1e293b; background: #fff; }
          .header { border-bottom: 2px solid #00C9B7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .brand { font-size: 24px; font-weight: 800; color: #0f172a; text-transform: uppercase; tracking-wide: 1px; }
          .brand span { color: #00C9B7; }
          .badge { background: #e6fffa; color: #047857; font-weight: 700; padding: 6px 16px; border-radius: 9999px; font-size: 12px; border: 1px solid #a7f3d0; text-transform: uppercase; }
          .badge.office { background: #f0f9ff; color: #0369a1; border-color: #bae6fd; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; }
          .section-title { font-weight: 700; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; font-size: 11px; color: #64748b; letter-spacing: 0.5px; }
          .val { font-size: 13.5px; margin-bottom: 6px; line-height: 1.5; color: #334155; }
          .val strong { color: #0f172a; }
          .table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px; }
          .table th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; color: #475569; }
          .table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
          .total-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 12px; width: 340px; margin-left: auto; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px; color: #475569; }
          .total-row.grand { font-size: 17px; font-weight: 800; border-top: 2px border #cbd5e1; padding-top: 10px; margin-top: 10px; color: #0f172a; }
          .footer { text-align: center; margin-top: 50px; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Next<span>Tour</span></div>
          <div>
            <span class="badge ${booking.bookingSource === 'office' ? 'office' : ''}">
              ${booking.bookingSource === 'office' ? 'OFFICE WALK-IN BOOKING' : 'BOOKING CONFIRMED'}
            </span>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="section-title">Customer Information</div>
            <div class="val"><strong>Name:</strong> ${booking.name || 'N/A'}</div>
            <div class="val"><strong>Phone:</strong> ${booking.phone || 'N/A'}</div>
            ${booking.whatsapp ? `<div class="val"><strong>WhatsApp:</strong> ${booking.whatsapp}</div>` : ''}
            ${booking.email ? `<div class="val"><strong>Email:</strong> ${booking.email}</div>` : ''}
            ${booking.city ? `<div class="val"><strong>City / Address:</strong> ${booking.city}</div>` : ''}
            ${booking.idProofType ? `<div class="val"><strong>${booking.idProofType}:</strong> ${booking.idProofNumber || 'Provided'}</div>` : ''}
          </div>
          <div class="box">
            <div class="section-title">Tour Departure Details</div>
            <div class="val"><strong>Booking Reference ID:</strong> ${booking.id}</div>
            <div class="val"><strong>Tour Package:</strong> ${booking.tripName}</div>
            <div class="val"><strong>Departure Date:</strong> ${booking.selectedDate}</div>
            <div class="val"><strong>Pickup Point:</strong> ${booking.pickupPoint || 'Main Departure Point'}</div>
            <div class="val"><strong>Total Travelers:</strong> ${booking.travelers} Persons</div>
            ${booking.bookingSource ? `<div class="val"><strong>Booking Source:</strong> ${booking.bookingSource.toUpperCase()}</div>` : ''}
          </div>
        </div>

        ${passengersHtml ? `
          <div class="section-title" style="margin-top: 10px;">Passenger List</div>
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Passenger Name</th>
                <th>Age / Gender</th>
              </tr>
            </thead>
            <tbody>
              ${passengersHtml}
            </tbody>
          </table>
        ` : ''}

        <div class="section-title">Package Summary</div>
        <table class="table">
          <thead>
            <tr>
              <th>Ref ID</th>
              <th>Description</th>
              <th>Travelers</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${booking.id}</td>
              <td><strong>${booking.tripName}</strong> Departure on ${booking.selectedDate}</td>
              <td>${booking.travelers} Members</td>
              <td style="text-align: right; font-weight: 700;">${formatCurrency(booking.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row"><span>Total Package Cost:</span><span>${formatCurrency(booking.amount)}</span></div>
          <div class="total-row" style="color: #047857; font-weight: 700;"><span>Advance / Amount Paid:</span><span>${formatCurrency(booking.paidAmount)}</span></div>
          <div class="total-row grand"><span>Pending Balance:</span><span>${formatCurrency(remaining)}</span></div>
        </div>

        <div class="footer">
          NextTour Travel Operations & Management System &bull; Office Counter Confirmation Slip
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

/**
 * Opens a print window with professional HTML content for Payment Receipt
 * @param {Object} booking 
 */
export const printPaymentReceipt = (booking) => {
  if (!booking) return;

  const printWindow = window.open('', '_blank', 'width=850,height=700');
  if (!printWindow) {
    alert('Please allow popups to print documents.');
    return;
  }

  const remaining = Math.max(0, (booking.amount || 0) - (booking.paidAmount || 0));
  const transactionsHtml = (booking.payments || []).map(txn => `
    <tr>
      <td>${txn.id}</td>
      <td>${new Date(txn.date || Date.now()).toLocaleDateString('en-IN')}</td>
      <td><span style="text-transform: uppercase; font-weight: 600;">${txn.mode || 'cash'}</span></td>
      <td>${txn.reference || 'N/A'}</td>
      <td style="text-align: right; font-weight: 700; color: #047857;">${formatCurrency(txn.amount)}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Receipt - ${booking.id}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #1e293b; background: #fff; }
          .header { border-bottom: 2px solid #047857; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .brand { font-size: 24px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
          .brand span { color: #047857; }
          .badge { background: #ecfdf5; color: #047857; font-weight: 700; padding: 6px 16px; border-radius: 9999px; font-size: 12px; border: 1px solid #a7f3d0; text-transform: uppercase; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; }
          .section-title { font-weight: 700; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; font-size: 11px; color: #64748b; letter-spacing: 0.5px; }
          .val { font-size: 13.5px; margin-bottom: 6px; color: #334155; }
          .val strong { color: #0f172a; }
          .table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px; }
          .table th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; color: #475569; }
          .table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
          .total-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 12px; width: 340px; margin-left: auto; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px; color: #475569; }
          .total-row.grand { font-size: 17px; font-weight: 800; border-top: 2px border #cbd5e1; padding-top: 10px; margin-top: 10px; color: #0f172a; }
          .footer { text-align: center; margin-top: 50px; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Next<span>Tour</span></div>
          <div><span class="badge">OFFICIAL PAYMENT RECEIPT</span></div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="section-title">Received From</div>
            <div class="val"><strong>Customer Name:</strong> ${booking.name || 'N/A'}</div>
            <div class="val"><strong>Phone Number:</strong> ${booking.phone || 'N/A'}</div>
            ${booking.whatsapp ? `<div class="val"><strong>WhatsApp:</strong> ${booking.whatsapp}</div>` : ''}
            ${booking.email ? `<div class="val"><strong>Email:</strong> ${booking.email}</div>` : ''}
          </div>
          <div class="box">
            <div class="section-title">Tour Reference</div>
            <div class="val"><strong>Booking Ref ID:</strong> ${booking.id}</div>
            <div class="val"><strong>Tour Package:</strong> ${booking.tripName}</div>
            <div class="val"><strong>Departure Date:</strong> ${booking.selectedDate}</div>
            <div class="val"><strong>Travelers:</strong> ${booking.travelers} Members</div>
          </div>
        </div>

        <div class="section-title">Transaction History</div>
        <table class="table">
          <thead>
            <tr>
              <th>Txn / Receipt ID</th>
              <th>Date</th>
              <th>Payment Mode</th>
              <th>Reference / UTR</th>
              <th style="text-align: right;">Amount Collected</th>
            </tr>
          </thead>
          <tbody>
            ${transactionsHtml || '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No transaction history found</td></tr>'}
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row"><span>Total Package Price:</span><span>${formatCurrency(booking.amount)}</span></div>
          <div class="total-row" style="color: #047857; font-weight: 700;"><span>Total Collected Amount:</span><span>${formatCurrency(booking.paidAmount)}</span></div>
          <div class="total-row grand"><span>Remaining Balance Due:</span><span>${formatCurrency(remaining)}</span></div>
        </div>

        <div class="footer">
          Thank you for choosing NextTour! Wish you a comfortable & safe journey.
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

/**
 * Opens a print window with professional HTML content for a Trip Profitability Audit Report
 * @param {Object} schedule 
 * @param {Object} tripFinances 
 */
export const printTripFinancialReport = (schedule, tripFinances) => {
  if (!schedule || !tripFinances) return;

  const printWindow = window.open('', '_blank', 'width=900,height=750');
  if (!printWindow) {
    alert('Please allow popups to print reports.');
    return;
  }

  const {
    bookingsCount,
    travelersCount,
    totalBookedValue,
    passengerRevenueCollection,
    pendingReceivables,
    totalExpenses,
    netProfitLoss,
    isProfit,
    profitMarginPercent,
    categoryBreakdown,
    scheduleExpenses,
    scheduleBookings
  } = tripFinances;

  const expensesHtml = (scheduleExpenses || []).map((exp, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${exp.date || '-'}</strong></td>
      <td style="text-transform: uppercase; font-weight: 600;">${exp.category || 'other'}</td>
      <td>${exp.notes || 'Expense item'}</td>
      <td style="text-align: right; font-weight: 700; color: #dc2626;">${formatCurrency(exp.amount)}</td>
    </tr>
  `).join('');

  const bookingsHtml = (scheduleBookings || []).map((b, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${b.name || 'Traveler'}</strong> (${b.phone || ''})</td>
      <td>${b.travelers || 1} Persons</td>
      <td>${formatCurrency(b.amount)}</td>
      <td style="color: #16a34a; font-weight: 700;">${formatCurrency(b.paidAmount)}</td>
      <td style="color: #dc2626;">${formatCurrency((b.amount || 0) - (b.paidAmount || 0))}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Trip Financial & Profitability Audit Report - ${schedule.tripTitle}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #0f172a; background: #fff; }
          .header { border-bottom: 2.5px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .brand { font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
          .brand span { color: #00C9B7; }
          .badge { font-weight: 800; padding: 6px 16px; border-radius: 9999px; font-size: 12px; border: 1.5px solid; text-transform: uppercase; }
          .badge.profit { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
          .badge.loss { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
          .grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; text-align: center; }
          .box .lbl { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
          .box .val { font-size: 18px; font-weight: 900; margin-top: 4px; color: #0f172a; }
          .box.profit .val { color: #166534; }
          .box.loss .val { color: #991b1b; }
          .section-title { font-weight: 800; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 12px; margin-top: 30px; text-transform: uppercase; font-size: 11px; color: #475569; letter-spacing: 0.5px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
          .table th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; color: #475569; }
          .table td { padding: 9px 12px; font-size: 12.5px; border-bottom: 1px solid #e2e8f0; }
          .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Next<span>Tour</span></div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 600;">Trip Financial & Profitability Audit Report</div>
          </div>
          <div>
            <span class="badge ${isProfit ? 'profit' : 'loss'}">
              ${isProfit ? `NET PROFIT: ${formatCurrency(netProfitLoss)} (${profitMarginPercent}%)` : `NET LOSS: ${formatCurrency(Math.abs(netProfitLoss))}`}
            </span>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
          <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${schedule.tripTitle}</div>
          <div style="font-size: 12.5px; color: #475569; margin-top: 4px;">
            Departure Date: <strong>${schedule.departureDate}</strong> &bull; Total Bookings: <strong>${bookingsCount} (${travelersCount} Passengers)</strong> &bull; Status: <strong>${schedule.status || 'Active'}</strong>
          </div>
        </div>

        <div class="grid">
          <div class="box">
            <div class="lbl">Total Booked Value</div>
            <div class="val">${formatCurrency(totalBookedValue)}</div>
          </div>
          <div class="box">
            <div class="lbl">Revenue Collected</div>
            <div class="val" style="color: #16a34a;">${formatCurrency(passengerRevenueCollection)}</div>
          </div>
          <div class="box">
            <div class="lbl">Total Trip Expenses</div>
            <div class="val" style="color: #dc2626;">${formatCurrency(totalExpenses)}</div>
          </div>
          <div class="box ${isProfit ? 'profit' : 'loss'}">
            <div class="lbl">Net Profit / Loss</div>
            <div class="val">${formatCurrency(netProfitLoss)}</div>
          </div>
        </div>

        <div class="section-title">1. Passenger Revenue Collection Breakdown</div>
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer Name</th>
              <th>Travelers</th>
              <th>Total Cost</th>
              <th>Collected Revenue</th>
              <th>Balance Due</th>
            </tr>
          </thead>
          <tbody>
            ${bookingsHtml || '<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No bookings registered for this departure date</td></tr>'}
          </tbody>
        </table>

        <div class="section-title">2. Trip Expenses Breakdown (Diesel, Water, Medical, Tickets, Vehicle...)</div>
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Expense Date</th>
              <th>Category</th>
              <th>Note / Description</th>
              <th style="text-align: right;">Amount Spent</th>
            </tr>
          </thead>
          <tbody>
            ${expensesHtml || '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No expenses recorded for this trip</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          NextTour Administrative Control & Financial Accounting &bull; Report Generated on ${new Date().toLocaleString('en-IN')}
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

