import { useState, useEffect } from 'react';
import { Search, Filter, X, Loader2, CheckCircle, Clock, AlertCircle, Phone, Mail, Calendar, Printer, Send, CreditCard, Plus, Building, UserCheck } from 'lucide-react';
import { subscribeToBookings, updateBookingStatus } from '../../firebase';
import { printBookingConfirmation, printPaymentReceipt } from '../../utils/printTemplates';
import { sendWhatsAppNotification } from '../../utils/whatsapp';
import { formatCurrency } from '../../utils/bookingUtils';
import OfficeBookingModal from '../../components/admin/OfficeBookingModal';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showOfficeBookingModal, setShowOfficeBookingModal] = useState(false);

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

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.phone?.includes(searchTerm) ||
      booking.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.tripName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || 
      (sourceFilter === 'office' && booking.bookingSource === 'office') ||
      (sourceFilter === 'web' && booking.bookingSource !== 'office');
    return matchesSearch && matchesStatus && matchesSource;
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
      {/* Header & Quick Action */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Manage Bookings</h1>
          <p className="text-gray-600 text-xs mt-0.5">{bookings.length} total reservations (Online & Office Counter)</p>
        </div>

        <button
          onClick={() => setShowOfficeBookingModal(true)}
          className="bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>New Office Booking</span>
        </button>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by ID, customer name, phone, email or trip package..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]" 
                />
              </div>

              <div className="flex gap-2">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select 
                  value={sourceFilter} 
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                >
                  <option value="all">All Channels</option>
                  <option value="office">Office Walk-In</option>
                  <option value="web">Online Website</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-600 text-xs font-bold uppercase tracking-wide border-b border-gray-200 bg-gray-50/50">
                  <th className="px-3 py-2.5">Ref / Source</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Trip Package</th>
                  <th className="px-3 py-2.5 text-center">Travelers</th>
                  <th className="px-3 py-2.5">Departure</th>
                  <th className="px-3 py-2.5 text-right">Cost</th>
                  <th className="px-3 py-2.5">Payment</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const StatusIcon = statusIcons[booking.status] || Clock;
                  const isOffice = booking.bookingSource === 'office';
                  return (
                    <tr key={booking.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                      <td className="px-3 py-2.5 align-middle">
                        <div className="font-mono text-[11px] font-bold text-gray-800">{booking.id}</div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOffice ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isOffice ? <Building size={10} /> : null}
                          {isOffice ? 'Office Counter' : 'Online Website'}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 align-middle">
                        <div className="text-gray-900 font-bold text-[13px]">{booking.name}</div>
                        <div className="text-gray-600 text-xs flex items-center gap-1">
                          <Phone size={11} className="text-gray-400" /> {booking.phone}
                        </div>
                      </td>

                      <td className="px-3 py-2.5 align-middle">
                        <div className="text-gray-900 font-bold text-[13px]">{booking.tripName || 'N/A'}</div>
                        {booking.pickupPoint && (
                          <div className="text-gray-500 text-[11px]">Pickup: {booking.pickupPoint}</div>
                        )}
                      </td>

                      <td className="px-3 py-2.5 align-middle text-center text-gray-800 text-xs font-bold">
                        {booking.travelers} Persons
                      </td>

                      <td className="px-3 py-2.5 align-middle text-gray-700 text-xs whitespace-nowrap">
                        {booking.selectedDate || 'N/A'}
                      </td>

                      <td className="px-3 py-2.5 align-middle text-right text-gray-900 font-bold text-[13px]">
                        {formatCurrency(booking.amount)}
                      </td>

                      <td className="px-3 py-2.5 align-middle">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase border ${
                          booking.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                          booking.paymentStatus === 'partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {booking.paymentStatus || 'pending'}
                        </span>
                        <div className="text-[10px] text-gray-600 mt-0.5">
                          Paid: {formatCurrency(booking.paidAmount || 0)}
                        </div>
                      </td>

                      <td className="px-3 py-2.5 align-middle">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                          <StatusIcon size={12} />
                          {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 align-middle">
                        <button
                          onClick={() => handleOpenDetails(booking)}
                          className="bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold py-1.5 px-3 rounded-lg text-xs transition-colors shadow-xs"
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

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredBookings.map((booking) => {
              const StatusIcon = statusIcons[booking.status] || Clock;
              const isOffice = booking.bookingSource === 'office';
              return (
                <div key={booking.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-gray-500">{booking.id}</span>
                        {isOffice && (
                          <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-sky-200">
                            Office Walk-In
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mt-0.5">{booking.name}</h4>
                      <p className="text-gray-600 text-xs">{booking.phone}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
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
                      <span className="text-gray-900">{formatCurrency(booking.amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Collected:</span>
                      <span className="text-green-600 font-bold">{formatCurrency(booking.paidAmount || 0)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenDetails(booking)}
                    className="w-full bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold py-2 px-4 rounded-xl text-xs transition-colors text-center"
                  >
                    Manage Reservation
                  </button>
                </div>
              );
            })}
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">No bookings match the selected criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">Reservation Manager</h3>
                  {selectedBooking.bookingSource === 'office' && (
                    <span className="bg-sky-50 text-sky-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-sky-200">
                      OFFICE COUNTER
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs font-mono">Ref ID: {selectedBooking.id}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Traveler Profile */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">Traveler Profile</h4>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2 text-xs text-gray-700">
                  <div>Name: <strong className="text-gray-900">{selectedBooking.name}</strong></div>
                  <div>Phone: <strong className="text-gray-900">{selectedBooking.phone}</strong></div>
                  {selectedBooking.whatsapp && <div>WhatsApp: <strong>{selectedBooking.whatsapp}</strong></div>}
                  {selectedBooking.email && <div>Email: <strong>{selectedBooking.email}</strong></div>}
                  {selectedBooking.city && <div>City / Address: <strong>{selectedBooking.city}</strong></div>}
                  {selectedBooking.pickupPoint && <div>Pickup Location: <strong>{selectedBooking.pickupPoint}</strong></div>}
                  {selectedBooking.idProofType && <div>{selectedBooking.idProofType}: <strong>{selectedBooking.idProofNumber || 'Submitted'}</strong></div>}
                  {selectedBooking.notes && <div className="text-xs text-yellow-800 bg-yellow-50 p-2 rounded-lg mt-2 italic">Notes: {selectedBooking.notes}</div>}
                </div>
              </div>

              {/* Status Updater */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">Trip Status</h4>
                <select
                  value={selectedBooking.status}
                  onChange={(e) => handleUpdateStatus(selectedBooking.id, e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#00C9B7] cursor-pointer text-xs font-bold"
                >
                  <option value="pending">Pending Request</option>
                  <option value="confirmed">Confirmed / Active</option>
                  <option value="completed">Completed Trip</option>
                  <option value="cancelled">Cancelled Booking</option>
                </select>
              </div>

              {/* Finance Overview */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">Financial Breakdown</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                    <span className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Total Package</span>
                    <span className="block font-black text-gray-900 mt-1">{formatCurrency(selectedBooking.amount)}</span>
                  </div>
                  <div className="border border-green-200 rounded-xl p-3 bg-green-50/30">
                    <span className="block text-[10px] text-green-600 uppercase tracking-wider font-bold">Collected</span>
                    <span className="block font-black text-green-700 mt-1">{formatCurrency(selectedBooking.paidAmount || 0)}</span>
                  </div>
                  <div className="border border-red-200 rounded-xl p-3 bg-red-50/30">
                    <span className="block text-[10px] text-red-500 uppercase tracking-wider font-bold">Unpaid Due</span>
                    <span className="block font-black text-red-700 mt-1">{formatCurrency((selectedBooking.amount || 0) - (selectedBooking.paidAmount || 0))}</span>
                  </div>
                </div>
              </div>

              {/* Printing Utilities */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">Printing & Receipts</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => printBookingConfirmation(selectedBooking)}
                    className="flex items-center justify-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors shadow-xs"
                  >
                    <Printer size={14} /> Confirmation Slip
                  </button>
                  <button
                    onClick={() => printPaymentReceipt(selectedBooking)}
                    className="flex items-center justify-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors shadow-xs"
                  >
                    <CreditCard size={14} /> Payment Receipt
                  </button>
                </div>
              </div>

              {/* WhatsApp Messages */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">WhatsApp Direct Notifications</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => sendWhatsAppNotification(selectedBooking, 'confirmation')}
                    className="flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 px-3 border border-green-200 rounded-xl text-xs transition-colors"
                  >
                    <Send size={12} /> Share Voucher
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
                    <Send size={12} /> Share Trip Reminder
                  </button>
                  <button
                    onClick={() => sendWhatsAppNotification(selectedBooking, 'updates')}
                    className="flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-2 px-3 border border-green-200 rounded-xl text-xs transition-colors"
                  >
                    <Send size={12} /> Share Pickup Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Office Walk-In Booking Modal */}
      <OfficeBookingModal
        isOpen={showOfficeBookingModal}
        onClose={() => setShowOfficeBookingModal(false)}
        onSuccess={(newBooking) => {
          console.log('Office Booking Success:', newBooking);
        }}
      />
    </div>
  );
};

export default AdminBookings;
