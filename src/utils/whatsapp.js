import { formatPhoneForWhatsApp, formatCurrency } from './bookingUtils';

/**
 * Sends a WhatsApp notification to a customer using WhatsApp Web / App URL
 * @param {Object} booking - Booking object containing customer details
 * @param {'confirmation' | 'receipt' | 'reminder' | 'updates' | 'office_voucher'} type - Notification type
 */
export const sendWhatsAppNotification = (booking, type = 'confirmation') => {
  if (!booking || !booking.phone) {
    alert('No customer phone number available to send WhatsApp notification.');
    return;
  }

  const remaining = Math.max(0, (booking.amount || 0) - (booking.paidAmount || 0));
  let message = '';

  switch (type) {
    case 'confirmation':
    case 'office_voucher':
      message = `Hello ${booking.name},\n\nYour booking for *${booking.tripName}* on *${booking.selectedDate}* has been *Confirmed*! 🎉\n\n*Booking Details:*\n- Reference ID: ${booking.id}\n- Travelers: ${booking.travelers} Members\n- Pickup Location: ${booking.pickupPoint || 'Main Departure Point'}\n- Total Cost: ${formatCurrency(booking.amount)}\n- Amount Paid: ${formatCurrency(booking.paidAmount)}\n- *Pending Balance: ${formatCurrency(remaining)}*\n${booking.bookingSource === 'office' ? '- *Booking Type: Office Walk-In Counter*\n' : ''}\nGet ready for an amazing adventure! 🏔️\n\nNextTour Team`;
      break;

    case 'receipt':
      message = `Hello ${booking.name},\n\nWe have successfully received your payment! 💳\n\n*Payment Summary:*\n- Reference ID: ${booking.id}\n- Tour Package: ${booking.tripName}\n- Departure Date: ${booking.selectedDate}\n- Total Cost: ${formatCurrency(booking.amount)}\n- Total Paid Amount: ${formatCurrency(booking.paidAmount)}\n- *Remaining Balance: ${formatCurrency(remaining)}*\n\nThank you for choosing NextTour!`;
      break;

    case 'reminder':
      message = `Hello ${booking.name},\n\nThis is a friendly reminder that your upcoming trip to *${booking.tripName}* departs on *${booking.selectedDate}*! ⏰\n\n*Important Notes:*\n- Pickup Point: ${booking.pickupPoint || 'Main Departure Point'}\n- Remaining Payment: ${formatCurrency(remaining)}\n\nPlease make sure to reach 15 minutes before departure. See you soon!`;
      break;

    case 'updates':
      message = `Hello ${booking.name},\n\nHere is an important update regarding your departure for *${booking.tripName}* on *${booking.selectedDate}*:\n\n- Pickup Location: ${booking.pickupPoint || 'Main Departure Point'}\n- Contact Number: ${booking.phone}\n\nFor any questions or assistance, please reply to this message. Safe travels!`;
      break;

    default:
      message = `Hello ${booking.name},\n\nThank you for choosing NextTour! Tour: *${booking.tripName}* on *${booking.selectedDate}*.`;
  }

  const formattedPhone = formatPhoneForWhatsApp(booking.whatsapp || booking.phone);
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};
