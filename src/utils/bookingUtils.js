/**
 * Calculates payment status based on total amount and paid amount
 * @param {number} amount - Total package cost
 * @param {number} paidAmount - Total amount collected so far
 * @returns {'paid' | 'partial' | 'pending'} Payment status string
 */
export const calculatePaymentStatus = (amount = 0, paidAmount = 0) => {
  const total = Number(amount) || 0;
  const paid = Number(paidAmount) || 0;

  if (total <= 0) return 'pending';
  if (paid >= total) return 'paid';
  if (paid > 0) return 'partial';
  return 'pending';
};

/**
 * Standardized Expense Categories for Trip Expenses
 */
export const EXPENSE_CATEGORIES = [
  { value: 'diesel', label: 'Diesel / Fuel' },
  { value: 'petrol', label: 'Petrol' },
  { value: 'vehicle', label: 'Vehicle / Transport Rent' },
  { value: 'ticket', label: 'Tickets & Entry Permits' },
  { value: 'medical', label: 'Medical & First Aid' },
  { value: 'water', label: 'Drinking Water & Refreshments' },
  { value: 'food', label: 'Food & Catering' },
  { value: 'hotel', label: 'Hotel & Lodging' },
  { value: 'guide', label: 'Tour Guide & Driver Allowance' },
  { value: 'other', label: 'Other Miscellaneous Expenses' }
];

export const getCategoryLabel = (catValue) => {
  const found = EXPENSE_CATEGORIES.find(c => c.value === catValue);
  return found ? found.label : (catValue ? catValue.toUpperCase() : 'General Expense');
};

/**
 * Calculates complete financial breakdown for a single booking
 * @param {Object} booking 
 */
export const calculateBookingFinances = (booking = {}) => {
  const totalAmount = Number(booking.amount) || 0;
  const paidAmount = Number(booking.paidAmount) || 0;
  const remainingBalance = Math.max(0, totalAmount - paidAmount);
  const paymentStatus = calculatePaymentStatus(totalAmount, paidAmount);

  return {
    totalAmount,
    paidAmount,
    remainingBalance,
    paymentStatus
  };
};

/**
 * Calculates complete financial audit for a trip schedule:
 * Revenue Collection (passenger payments) - Expenses = Net Profit / Loss
 * @param {Object} schedule 
 * @param {Array} bookings 
 * @param {Array} expenses 
 */
export const calculateTripFinances = (schedule, bookings = [], expenses = []) => {
  if (!schedule) return null;

  const schedTitle = (schedule.tripTitle || schedule.title || '').toLowerCase();
  const schedDate = schedule.departureDate || schedule.date || '';

  // Filter bookings for this schedule or trip departure
  const scheduleBookings = bookings.filter(b => {
    if (b.scheduleId && String(b.scheduleId) === String(schedule.id)) return true;
    if (schedule.tripId && String(b.tripId) === String(schedule.tripId) && b.selectedDate === schedDate) return true;
    const bName = (b.tripName || '').toLowerCase();
    if (schedTitle && bName && (bName.includes(schedTitle) || schedTitle.includes(bName)) && b.selectedDate === schedDate) return true;
    if (schedTitle && bName && !schedDate && (bName.includes(schedTitle) || schedTitle.includes(bName))) return true;
    return false;
  });

  const bookingsCount = scheduleBookings.length;
  const travelersCount = scheduleBookings.reduce((sum, b) => sum + (Number(b.travelers) || 1), 0);
  const totalBookedValue = scheduleBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const passengerRevenueCollection = scheduleBookings.reduce((sum, b) => sum + (Number(b.paidAmount) || 0), 0);
  const pendingReceivables = totalBookedValue - passengerRevenueCollection;

  // Expenses logged under this schedule
  const scheduleExpenses = expenses.filter(e => {
    if (e.scheduleId && String(e.scheduleId) === String(schedule.id)) return true;
    const expTitle = (e.tripTitle || '').toLowerCase();
    if (schedTitle && expTitle && (expTitle.includes(schedTitle) || schedTitle.includes(expTitle))) return true;
    return false;
  });
  const totalExpenses = scheduleExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Category-wise expense breakdown
  const categoryBreakdown = {};
  EXPENSE_CATEGORIES.forEach(cat => {
    categoryBreakdown[cat.value] = 0;
  });

  scheduleExpenses.forEach(e => {
    const catKey = e.category || 'other';
    categoryBreakdown[catKey] = (categoryBreakdown[catKey] || 0) + (Number(e.amount) || 0);
  });

  // Net Profit / Loss Calculation
  // Passenger Revenue Collection - Total Trip Expenses = Profit/Loss
  const netProfitLoss = passengerRevenueCollection - totalExpenses;
  const isProfit = netProfitLoss >= 0;
  const profitMarginPercent = passengerRevenueCollection > 0 
    ? ((netProfitLoss / passengerRevenueCollection) * 100).toFixed(1)
    : 0;

  return {
    scheduleId: schedule.id,
    tripTitle: schedule.tripTitle,
    departureDate: schedule.departureDate,
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
  };
};

/**
 * Generates a unique, human-readable Booking Reference ID
 * @param {'office' | 'web' | 'agent'} source - Origin of the booking
 * @returns {string} Unique Booking ID e.g. NT-OFF-8492
 */
export const generateBookingId = (source = 'office') => {
  const prefixMap = {
    office: 'NT-OFF',
    web: 'NT-WEB',
    agent: 'NT-AGT'
  };
  const prefix = prefixMap[source] || 'NT-BK';
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const timeStamp = Date.now().toString().slice(-3);
  return `${prefix}-${randomDigits}${timeStamp}`;
};

/**
 * Formats phone numbers for WhatsApp API compatibility (adds Indian 91 country code if needed)
 * @param {string} phone 
 * @returns {string} Formatted 12-digit phone string e.g. 919876543210
 */
export const formatPhoneForWhatsApp = (phone = '') => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    return `91${cleanPhone}`;
  }
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    return cleanPhone;
  }
  return cleanPhone;
};

/**
 * Formats a number into Indian Rupee currency string
 * @param {number} amount 
 * @returns {string} e.g. ₹15,000
 */
export const formatCurrency = (amount = 0) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Utility to export tabular data to CSV / Excel file for admin downloads
 * @param {string} filename 
 * @param {Array<Object>} rows 
 * @param {Array<string>} headers 
 */
export const exportToCSV = (filename, rows, headers) => {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      headers.map(header => {
        let cell = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
        cell = cell.replace(/"/g, '""');
        if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

