import { useState, useEffect } from 'react';
import { Search, Filter, X, Loader2, CheckCircle, Clock, AlertCircle, Phone, Mail, Calendar, Printer, Send, CreditCard } from 'lucide-react';
import { subscribeToBookings, updateBookingStatus } from '../../firebase';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    console.log('Admin Bookings: Setting up subscription...');
    const unsubscribe = subscribeToBookings((data) => {
      console.log('Admin Bookings: Bookings loaded:', data.length);
      setBookings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateBookingStatus(id, status);
      // Update local selectedBooking state if open
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(prev => ({ ...prev, status }));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleOpenDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  // --- PRINT TEMPLATES ---

  const printBookingConfirmation = (booking) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const remaining = (booking.amount || 0) - (booking.paidAmount || 0);
    const htmlContent = `
      <html>
        <head>
          <title>Confirmation - ${booking.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #00C9B7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 26px; font-weight: bold; color: #111; }
            .badge { background: #e6f4ea; color: #137333; font-weight: bold; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-weight: bold; border-bottom: 1.5px solid #eee; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase; font-size: 11px; color: #777; tracking-wider: 1px; }
            .val { font-size: 14px; margin-bottom: 8px; line-height: 1.5; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 40px; }
            .table th { background: #f8f9fa; font-size: 11px; text-transform: uppercase; text-align: left; padding: 12px; border-bottom: 2px solid #eee; color: #555; }
            .table td { padding: 12px; font-size: 14px; border-bottom: 1px solid #eee; }
            .total-box { background: #f8f9fa; border: 1px solid #eee; padding: 20px; border-radius: 12px; width: 320px; margin-left: auto; text-align: right; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .total-row.grand { font-size: 18px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px; color: #111; }
            .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">NextTour Operations</div>
            <div class="badge">BOOKING CONFIRMED</div>
          </div>
          <div class="grid">
            <div>
              <div class="section-title">Customer / Traveler</div>
              <div class="val"><strong>Name:</strong> ${booking.name}</div>
              <div class="val"><strong>Phone:</strong> ${booking.phone}</div>
              ${booking.whatsapp ? `<div class="val"><strong>WhatsApp:</strong> ${booking.whatsapp}</div>` : ''}
              ${booking.email ? `<div class="val"><strong>Email:</strong> ${booking.email}</div>` : ''}
              ${booking.city ? `<div class="val"><strong>City:</strong> ${booking.city}</div>` : ''}
            </div>
            <div>
              <div class="section-title">Tour Details</div>
              <div class="val"><strong>Booking ID:</strong> ${booking.id}</div>
              <div class="val"><strong>Trip departure:</strong> ${booking.selectedDate}</div>
              <div class="val"><strong>Pickup Point:</strong> ${booking.pickupPoint || 'N/A'}</div>
              <div class="val"><strong>Travelers Count:</strong> ${booking.travelers} Persons</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Booking Reference</th>
                <th>Tour Package Detail</th>
                <th style="text-align: right;">Total Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${booking.id}</td>
                <td><strong>${booking.tripName}</strong> - Group reservation for ${booking.travelers} members</td>
                <td style="text-align: right; font-weight: bold;">₹${booking.amount?.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
            <div class="total-row"><span>Total Amount:</span><span>₹${booking.amount?.toLocaleString()}</span></div>
            <div class="total-row" style="color: #137333; font-weight: bold;"><span>Advance Paid:</span><span>₹${(booking.paidAmount || 0).toLocaleString()}</span></div>
            <div class="total-row grand"><span>Pending Balance:</span><span>₹${remaining.toLocaleString()}</span></div>
          </div>

          <div class="footer">
            NextTour White-Label Travel Management Platform
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

  const printPaymentReceipt = (booking) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const remaining = (booking.amount || 0) - (booking.paidAmount || 0);
    const transactionsHtml = (booking.payments || []).map(txn => `
      <tr>
        <td>${txn.id}</td>
        <td>${new Date(txn.date).toLocaleDateString('en-IN')}</td>
        <td><span style="text-transform: uppercase;">${txn.mode}</span></td>
        <td>${txn.reference || 'N/A'}</td>
        <td style="text-align: right; font-weight: bold;">₹${txn.amount?.toLocaleString()}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Receipt - ${booking.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #2e7d32; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 26px; font-weight: bold; color: #111; }
            .badge { background: #e8f5e9; color: #2e7d32; font-weight: bold; padding: 5px 15px; border-radius: 20px; font-size: 12px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .section-title { font-weight: bold; border-bottom: 1.5px solid #eee; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase; font-size: 11px; color: #777; }
            .val { font-size: 14px; margin-bottom: 8px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 40px; }
            .table th { background: #f8f9fa; font-size: 11px; text-transform: uppercase; text-align: left; padding: 12px; border-bottom: 2px solid #eee; }
            .table td { padding: 12px; font-size: 14px; border-bottom: 1px solid #eee; }
            .total-box { background: #f8f9fa; border: 1px solid #eee; padding: 20px; border-radius: 12px; width: 320px; margin-left: auto; text-align: right; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .total-row.grand { font-size: 18px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px; color: #111; }
            .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">NextTour Operations</div>
            <div class="badge">PAYMENT RECEIPT</div>
          </div>
          <div class="grid">
            <div>
              <div class="section-title">Received From</div>
              <div class="val"><strong>Name:</strong> ${booking.name}</div>
              <div class="val"><strong>Phone:</strong> ${booking.phone}</div>
              ${booking.whatsapp ? `<div class="val"><strong>WhatsApp:</strong> ${booking.whatsapp}</div>` : ''}
            </div>
            <div>
              <div class="section-title">Tour Description</div>
              <div class="val"><strong>Booking Reference ID:</strong> ${booking.id}</div>
              <div class="val"><strong>Tour Package:</strong> ${booking.tripName}</div>
              <div class="val"><strong>Departure Date:</strong> ${booking.selectedDate}</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Receipt / Txn ID</th>
                <th>Payment Date</th>
                <th>Mode</th>
                <th>Reference ID</th>
                <th style="text-align: right;">Amount Received</th>
              </tr>
            </thead>
            <tbody>
              ${transactionsHtml || '<tr><td colspan="5" style="text-align: center; color: #999;">No transaction records found</td></tr>'}
            </tbody>
          </table>

          <div class="total-box">
            <div class="total-row"><span>Total Package Cost:</span><span>₹${booking.amount?.toLocaleString()}</span></div>
            <div class="total-row" style="color: #2e7d32; font-weight: bold;"><span>Total Paid Amount:</span><span>₹${(booking.paidAmount || 0).toLocaleString()}</span></div>
            <div class="total-row grand"><span>Remaining Balance:</span><span>₹${remaining.toLocaleString()}</span></div>
          </div>

          <div class="footer">
            Thank you for your payment. Have a fantastic tour departure!
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

  // --- WHATSAPP COMMUNICATION SENDS ---

  const sendWhatsAppNotification = (booking, type) => {
    const remaining = (booking.amount || 0) - (booking.paidAmount || 0);
    let message = '';

    if (type === 'confirmation') {
      message = `Hello ${booking.name},\n\nYour booking for *${booking.tripName}* on *${booking.selectedDate}* has been *Confirmed*! 🎉\n\n*Booking Details:*\n- Reference ID: ${booking.id}\n- Travelers: ${booking.travelers} Members\n- Pickup Location: ${booking.pickupPoint || 'N/A'}\n- Total Cost: ₹${booking.amount?.toLocaleString()}\n- Paid Amount: ₹${(booking.paidAmount || 0).toLocaleString()}\n- *Pending Balance: ₹${remaining.toLocaleString()}*\n\nGet ready for an amazing adventure! 🏔️\n\nNextTour Team`;
    } else if (type === 'receipt') {
      message = `Hello ${booking.name},\n\nWe have successfully received your payment! 💳\n\n*Transaction Summary:*\n- Tour: ${booking.tripName}\n- Date: ${booking.selectedDate}\n- Total Paid: ₹${(booking.paidAmount || 0).toLocaleString()}\n- *Remaining Balance: ₹${remaining.toLocaleString()}*\n\nThank you for choosing NextTour!`;
    } else if (type === 'reminder') {
      message = `Hello ${booking.name},\n\nThis is a friendly reminder that your upcoming trip to *${booking.tripName}* departures on *${booking.selectedDate}*! ⏰\n\n*Important Notes:*\n- Pickup Point: ${booking.pickupPoint || 'Main Departure Point'}\n- Remaining Payment: ₹${remaining.toLocaleString()}\n\nPlease make sure to reach 15 minutes before the departure. See you soon!`;
    } else if (type === 'updates') {
      message = `Hello ${booking.name},\n\nHere is an important update regarding your departure for *${booking.tripName}* on *${booking.selectedDate}*:\n\n- Pickup Location: ${booking.pickupPoint}\n- Contact Number: ${booking.phone}\n\nFor any details or emergencies, please reach out to us. Safe travels!`;
    }

    const cleanPhone = booking.phone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 ? cleanPhone : `91${cleanPhone}`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone?.includes(searchTerm) ||
      booking.tripName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    confirmed: 'bg-green-50 text-green-700 border border-green-200',
    completed: 'bg-blue-50 text-blue-700 border border-blue-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200'
  };

  const statusIcons = {
    pending: Clock,
    confirmed: CheckCircle,
    completed: CheckCircle,
    cancelled: AlertCircle
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Manage Bookings</h1>
          <p className="text-gray-400 text-xs mt-0.5">{bookings.length} bookings total</p>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by name, email, phone or trip..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                />
              </div>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-200 bg-gray-50/50">
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">Trip Package</th>
                  <th className="p-4 text-center">Travelers</th>
                  <th className="px-3 py-2">Departure Date</th>
                  <th className="p-4 text-right">Cost</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2">Booking Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const StatusIcon = statusIcons[booking.status] || Clock;
                  return (
                    <tr key={booking.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 align-middle">
                        <div className="text-gray-900 font-bold text-[13px]">{booking.name}</div>
                        {booking.email && <div className="text-gray-400 text-[11px]">{booking.email}</div>}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-gray-600 text-xs">
                            <Phone size={13} className="text-gray-400" /> {booking.phone}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="text-gray-900 font-bold text-[13px]">{booking.tripName || 'N/A'}</div>
                      </td>
                      <td className="px-3 py-2 align-middle text-center text-gray-800 text-xs font-bold">{booking.travelers}</td>
                      <td className="px-3 py-2 align-middle text-gray-600 text-xs">{booking.selectedDate || 'N/A'}</td>
                      <td className="px-3 py-2 align-middle text-right text-gray-900 font-bold text-[13px]">₹{booking.amount?.toLocaleString() || 0}</td>
                      <td className="px-3 py-2 align-middle">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          booking.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                          booking.paymentStatus === 'partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {booking.paymentStatus || 'pending'}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                          <StatusIcon size={12} />
                          {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <button
                          onClick={() => handleOpenDetails(booking)}
                          className="bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold py-1.5 px-3 rounded-lg text-xs transition-colors shadow-sm"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredBookings.map((booking) => {
              const StatusIcon = statusIcons[booking.status] || Clock;
              return (
                <div key={booking.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-[14px]">{booking.name}</h4>
                      <p className="text-gray-500 text-xs mt-0.5">{booking.phone}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                      <StatusIcon size={10} />
                      {booking.status}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Package:</span>
                      <span className="font-bold text-gray-800">{booking.tripName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Departure:</span>
                      <span className="font-semibold text-gray-800">{booking.selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Travelers:</span>
                      <span className="font-bold text-gray-800">{booking.travelers} Persons</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200/60 pt-1.5 mt-1.5 font-bold">
                      <span className="text-gray-500">Total Price:</span>
                      <span className="text-gray-900">₹{booking.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Collected:</span>
                      <span className="text-green-600 font-bold">₹{(booking.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Payment:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        booking.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                        booking.paymentStatus === 'partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {booking.paymentStatus || 'pending'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenDetails(booking)}
                    className="w-full bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm text-center"
                  >
                    Manage Reservation
                  </button>
                </div>
              );
            })}
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No bookings found</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Operations Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Manage Reservation</h3>
                <p className="text-gray-500 text-xs">ID: {selectedBooking.id}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Profile Block */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Traveler Profile</h4>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2 text-sm text-gray-700">
                  <div>Name: <strong>{selectedBooking.name}</strong></div>
                  <div>Phone: <strong>{selectedBooking.phone}</strong></div>
                  {selectedBooking.whatsapp && <div>WhatsApp: <strong>{selectedBooking.whatsapp}</strong></div>}
                  {selectedBooking.email && <div>Email: <strong>{selectedBooking.email}</strong></div>}
                  {selectedBooking.city && <div>City/Address: <strong>{selectedBooking.city}</strong></div>}
                  {selectedBooking.pickupPoint && <div>Pickup Point: <strong>{selectedBooking.pickupPoint}</strong></div>}
                  {selectedBooking.notes && <div className="text-xs text-yellow-700 italic bg-yellow-50/50 p-2 rounded-lg mt-2">Notes: {selectedBooking.notes}</div>}
                </div>
              </div>

              {/* Status Updater */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Update Trip Status</h4>
                <select
                  value={selectedBooking.status}
                  onChange={(e) => handleUpdateStatus(selectedBooking.id, e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 cursor-pointer text-sm font-semibold"
                >
                  <option value="pending">Pending Request</option>
                  <option value="confirmed">Confirmed / Active</option>
                  <option value="completed">Completed Trip</option>
                  <option value="cancelled">Cancelled Booking</option>
                </select>
              </div>

              {/* Invoicing Section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Finance & Receivables</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/30">
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Total</span>
                    <span className="block font-black text-gray-800 mt-1">₹{selectedBooking.amount?.toLocaleString()}</span>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-3 bg-green-50/20">
                    <span className="block text-[10px] text-green-500 uppercase tracking-wider">Collected</span>
                    <span className="block font-black text-green-700 mt-1">₹{(selectedBooking.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-3 bg-red-50/20">
                    <span className="block text-[10px] text-red-500 uppercase tracking-wider">Unpaid</span>
                    <span className="block font-black text-red-750 mt-1">₹{((selectedBooking.amount || 0) - (selectedBooking.paidAmount || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Documents Printer Row */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Receipts & Documentation</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => printBookingConfirmation(selectedBooking)}
                    className="flex items-center justify-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    <Printer size={14} /> Booking Confirmation
                  </button>
                  <button
                    onClick={() => printPaymentReceipt(selectedBooking)}
                    className="flex items-center justify-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm"
                  >
                    <CreditCard size={14} /> Payment Receipt
                  </button>
                </div>
              </div>

              {/* WhatsApp Communications Group */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">WhatsApp Notifications</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => sendWhatsAppNotification(selectedBooking, 'confirmation')}
                    className="flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 px-3 border border-green-200 rounded-xl text-xs transition-colors"
                  >
                    <Send size={12} /> Share Confirmation
                  </button>
                  <button
                    onClick={() => sendWhatsAppNotification(selectedBooking, 'receipt')}
                    className="flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 px-3 border border-green-200 rounded-xl text-xs transition-colors"
                  >
                    <Send size={12} /> Share Receipt
                  </button>
                  <button
                    onClick={() => sendWhatsAppNotification(selectedBooking, 'reminder')}
                    className="flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 px-3 border border-green-200 rounded-xl text-xs transition-colors"
                  >
                    <Send size={12} /> Share Trip Details
                  </button>
                  <button
                    onClick={() => sendWhatsAppNotification(selectedBooking, 'updates')}
                    className="flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 px-3 border border-green-200 rounded-xl text-xs transition-colors"
                  >
                    <Send size={12} /> Share Pickup Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
