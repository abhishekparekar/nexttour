import { useState, useEffect } from 'react';
import { subscribeToBookings } from '../../firebase';
import { Search, Loader2, Calendar, Phone, AlertTriangle, Send } from 'lucide-react';

const AdminPendingPayments = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tripFilter, setTripFilter] = useState('all');

  useEffect(() => {
    const unsubscribe = subscribeToBookings((data) => {
      // Filter out bookings that are fully paid or cancelled
      const pendingData = data.filter(b => b.paymentStatus !== 'paid' && b.status !== 'cancelled');
      setBookings(pendingData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Get unique trip names for filter dropdown
  const uniqueTrips = [...new Set(bookings.map(b => b.tripName))];

  const handleSendReminder = (booking) => {
    const remaining = (booking.amount || 0) - (booking.paidAmount || 0);
    const message = `Hello ${booking.name},\n\nThis is a friendly reminder regarding your booking for *${booking.tripName}* scheduled for *${booking.selectedDate}*.\n\n*Payment Summary:*\n- Total Amount: ₹${booking.amount?.toLocaleString()}\n- Paid Amount: ₹${(booking.paidAmount || 0).toLocaleString()}\n- *Pending Balance: ₹${remaining.toLocaleString()}*\n\nPlease process the remaining amount at your earliest convenience.\n\nThank you,\nNextTour Support`;
    
    // Clean phone number (remove spaces, symbols)
    const cleanPhone = booking.phone.replace(/[^0-9]/g, '');
    const finalPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 ? cleanPhone : `91${cleanPhone}`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phone?.includes(searchTerm);
    const matchesTrip = tripFilter === 'all' || b.tripName === tripFilter;
    return matchesSearch && matchesTrip;
  });

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
          <h1 className="text-lg font-bold text-gray-900">Pending Payments</h1>
          <p className="text-gray-400 text-xs mt-0.5">{bookings.length} unpaid bookings pending balance</p>
        </div>
      </div>

      <div className="p-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
          </div>
          <select
            value={tripFilter}
            onChange={(e) => setTripFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="all">All Tour Packages</option>
            {uniqueTrips.map((tripName, index) => (
              <option key={index} value={tripName}>{tripName}</option>
            ))}
          </select>
        </div>

        {/* Pending Payments Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-200 bg-gray-50/50">
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Tour Package / Departure</th>
                  <th className="p-4 text-right">Total Cost</th>
                  <th className="p-4 text-right">Paid Amount</th>
                  <th className="p-4 text-right">Unpaid Balance</th>
                  <th className="px-3 py-2">Payment Status</th>
                  <th className="px-3 py-2">Reminder</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => {
                  const unpaid = (booking.amount || 0) - (booking.paidAmount || 0);
                  return (
                    <tr key={booking.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 align-middle">
                        <div className="text-gray-900 font-bold text-[13px]">{booking.name}</div>
                        <div className="text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone size={11} /> {booking.phone}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="text-gray-900 font-bold text-[13px]">{booking.tripName}</div>
                        <div className="text-gray-400 text-[11px] mt-0.5">{booking.selectedDate}</div>
                      </td>
                      <td className="px-3 py-2 align-middle text-right text-gray-900 font-bold text-[13px]">
                        ₹{booking.amount?.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 align-middle text-right text-green-600 font-bold text-[13px]">
                        ₹{(booking.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 align-middle text-right text-red-600 font-bold text-[13px]">
                        ₹{unpaid.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          booking.paymentStatus === 'pending'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {booking.paymentStatus || 'pending'}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <button
                          onClick={() => handleSendReminder(booking)}
                          className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-1.5 px-3 rounded-lg text-xs border border-green-200 transition-colors shadow-sm"
                        >
                          <Send size={12} /> Send Alert
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block lg:hidden divide-y divide-gray-100">
            {filteredBookings.map(booking => {
              const unpaid = (booking.amount || 0) - (booking.paidAmount || 0);
              return (
                <div key={booking.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-[14px]">{booking.name}</h4>
                      <p className="text-gray-500 text-xs mt-0.5">{booking.phone}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      booking.paymentStatus === 'pending'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                      {booking.paymentStatus || 'pending'}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Package:</span>
                      <span className="font-bold text-gray-900">{booking.tripName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Departure:</span>
                      <span className="font-semibold text-gray-800">{booking.selectedDate}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200/60 pt-1.5 mt-1.5 font-bold">
                      <span className="text-gray-500">Unpaid Balance:</span>
                      <span className="text-red-600 font-bold">₹{unpaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Paid / Cost:</span>
                      <span className="text-gray-800">₹{(booking.paidAmount || 0).toLocaleString()} / ₹{booking.amount?.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendReminder(booking)}
                    className="w-full flex items-center justify-center gap-1.5 bg-green-50 hover:bg-green-150 text-green-700 font-bold py-2 px-4 rounded-xl text-xs transition-colors border border-green-200 shadow-sm"
                  >
                    <Send size={12} /> Send WhatsApp Alert
                  </button>
                </div>
              );
            })}
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 font-semibold mb-1">No pending payments</h3>
              <p className="text-gray-500 text-sm">All currently tracked active bookings are fully paid.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPendingPayments;
