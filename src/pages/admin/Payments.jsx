import { useState, useEffect } from 'react';
import { subscribeToBookings, updateBookingPayments } from '../../firebase';
import { Search, CreditCard, Plus, X, Loader2, DollarSign, Calendar, MessageSquare, AlertCircle, Phone, ArrowUpRight } from 'lucide-react';

const AdminPayments = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    mode: 'cash',
    reference: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeToBookings((data) => {
      setBookings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenPaymentModal = (booking) => {
    setSelectedBooking(booking);
    setFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      mode: 'cash',
      reference: ''
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setError(null);

    const paymentAmount = Number(formData.amount);
    if (!paymentAmount || paymentAmount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    const currentPaid = selectedBooking.paidAmount || 0;
    const totalAmount = selectedBooking.amount || 0;
    const remainingBalance = totalAmount - currentPaid;

    if (paymentAmount > remainingBalance) {
      setError(`Payment amount cannot exceed the remaining balance of ₹${remainingBalance.toLocaleString()}`);
      return;
    }

    try {
      const newTransaction = {
        id: `TXN_${Date.now()}`,
        amount: paymentAmount,
        date: formData.date,
        mode: formData.mode,
        reference: formData.reference || 'N/A'
      };

      const currentPayments = selectedBooking.payments || [];
      const updatedPayments = [...currentPayments, newTransaction];
      const newPaidAmount = currentPaid + paymentAmount;
      const newPendingAmount = totalAmount - newPaidAmount;
      
      let newPaymentStatus = 'pending';
      if (newPaidAmount === totalAmount) {
        newPaymentStatus = 'paid';
      } else if (newPaidAmount > 0) {
        newPaymentStatus = 'partial';
      }

      const updatedFields = {
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount,
        paymentStatus: newPaymentStatus,
        status: newPaidAmount > 0 ? 'confirmed' : selectedBooking.status
      };

      await updateBookingPayments(selectedBooking.id, updatedPayments, updatedFields);
      setShowModal(false);
    } catch (err) {
      setError('Failed to record payment transaction.');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.tripName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phone?.includes(searchTerm);
    const matchesPaymentStatus = paymentFilter === 'all' || b.paymentStatus === paymentFilter;
    return matchesSearch && matchesPaymentStatus;
  });

  const paymentStatusColors = {
    pending: 'bg-red-50 text-red-700 border border-red-200',
    partial: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    paid: 'bg-green-50 text-green-700 border border-green-200'
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
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{bookings.length} active bookings tracked</p>
        </div>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="all">All Payment Statuses</option>
            <option value="pending">Pending</option>
            <option value="partial">Partially Paid</option>
            <option value="paid">Fully Paid</option>
          </select>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-200 bg-gray-50/50">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Tour Package / Date</th>
                  <th className="p-4 text-right">Total Amount</th>
                  <th className="p-4 text-right">Paid Amount</th>
                  <th className="p-4 text-right">Pending Balance</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4">Transactions</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(booking => {
                  const remaining = (booking.amount || 0) - (booking.paidAmount || 0);
                  const isFullyPaid = remaining <= 0;
                  return (
                    <tr key={booking.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="p-4 align-middle">
                        <div className="text-gray-900 font-bold text-[13px]">{booking.name}</div>
                        <div className="text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone size={11} /> {booking.phone}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="text-gray-900 font-bold text-[13px]">{booking.tripName}</div>
                        <div className="text-gray-400 text-[11px] mt-0.5">{booking.selectedDate}</div>
                      </td>
                      <td className="p-4 align-middle text-right text-gray-900 font-bold text-[13px]">
                        ₹{booking.amount?.toLocaleString()}
                      </td>
                      <td className="p-4 align-middle text-right text-green-600 font-bold text-[13px]">
                        ₹{(booking.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-4 align-middle text-right text-red-600 font-bold text-[13px]">
                        ₹{remaining.toLocaleString()}
                      </td>
                      <td className="p-4 align-middle">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${paymentStatusColors[booking.paymentStatus || 'pending']}`}>
                          {booking.paymentStatus || 'pending'}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-gray-600 text-xs">
                        {booking.payments && booking.payments.length > 0 ? (
                          <div className="space-y-1">
                            {booking.payments.map((txn, index) => (
                              <div key={txn.id || index} className="text-[10px] text-gray-500 flex items-center gap-1 bg-gray-50 p-1 rounded border border-gray-100">
                                <ArrowUpRight size={10} className="text-green-500" />
                                <span>₹{txn.amount} ({txn.mode})</span>
                              </div>
                            ))}
                          </div>
                        ) : 'None'}
                      </td>
                      <td className="p-4 align-middle">
                        <button
                          disabled={isFullyPaid}
                          onClick={() => handleOpenPaymentModal(booking)}
                          className="flex items-center gap-1 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold py-1.5 px-3 rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus size={14} /> Add Payment
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
              const remaining = (booking.amount || 0) - (booking.paidAmount || 0);
              const isFullyPaid = remaining <= 0;
              return (
                <div key={booking.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-[14px]">{booking.name}</h4>
                      <p className="text-gray-500 text-xs mt-0.5">{booking.phone}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${paymentStatusColors[booking.paymentStatus || 'pending']}`}>
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
                      <span className="text-gray-500">Total Amount:</span>
                      <span className="text-gray-950">₹{booking.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Collected:</span>
                      <span className="text-green-600 font-bold">₹{(booking.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Balance Unpaid:</span>
                      <span className="text-red-600 font-bold">₹{remaining.toLocaleString()}</span>
                    </div>
                    {booking.payments && booking.payments.length > 0 && (
                      <div className="border-t border-gray-200/60 pt-2 mt-2">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Receipts Log</span>
                        <div className="flex flex-wrap gap-1.5">
                          {booking.payments.map((txn, index) => (
                            <span key={txn.id || index} className="text-[9px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 font-semibold">
                              ₹{txn.amount} ({txn.mode})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    disabled={isFullyPaid}
                    onClick={() => handleOpenPaymentModal(booking)}
                    className="w-full flex items-center justify-center gap-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold py-2 px-4 rounded-xl text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-primary-200"
                  >
                    <Plus size={14} /> Add Payment Receipt
                  </button>
                </div>
              );
            })}
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 font-semibold mb-1">No bookings found</h3>
              <p className="text-gray-500 text-sm">Create bookings or adjust filters to list payment histories.</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Entry Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Record Payment Receipt</h3>
                <p className="text-gray-500 text-xs">Customer: {selectedBooking.name}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                <div>
                  <span className="block text-xs text-gray-400 uppercase tracking-wider mb-0.5">Total Package:</span>
                  <span className="font-bold text-gray-900">₹{selectedBooking.amount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-400 uppercase tracking-wider mb-0.5">Remaining Balance:</span>
                  <span className="font-bold text-red-600">₹{((selectedBooking.amount || 0) - (selectedBooking.paidAmount || 0)).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Payment Amount (INR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={(selectedBooking.amount || 0) - (selectedBooking.paidAmount || 0)}
                  placeholder="e.g. 5000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Payment Mode *</label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white cursor-pointer"
                  >
                    <option value="cash">Cash Payment</option>
                    <option value="upi">UPI (GPay/PhonePe)</option>
                    <option value="bank_transfer">Bank Transfer / IMPS</option>
                    <option value="card">Debit/Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Transaction Reference ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref Number, Bank Txn ID"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-white border border-gray-300 text-gray-700 font-bold py-2.5 px-5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md"
                >
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
