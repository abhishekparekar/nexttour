import { useState, useEffect } from 'react';
import { subscribeToBookings, updateBookingPayments } from '../../firebase';
import { calculateBookingFinances, formatCurrency } from '../../utils/bookingUtils';
import { printPaymentReceipt, printBookingConfirmation } from '../../utils/printTemplates';
import { Search, CreditCard, Plus, X, Loader2, DollarSign, Calendar, MessageSquare, AlertCircle, Phone, ArrowUpRight, Printer } from 'lucide-react';

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
    const { remainingBalance } = calculateBookingFinances(booking);
    setFormData({
      amount: remainingBalance > 0 ? remainingBalance : '',
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

    const { totalAmount, paidAmount, remainingBalance } = calculateBookingFinances(selectedBooking);

    if (paymentAmount > remainingBalance) {
      setError(`Payment amount cannot exceed the remaining balance of ${formatCurrency(remainingBalance)}`);
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
      const newPaidAmount = paidAmount + paymentAmount;
      const newPendingAmount = totalAmount - newPaidAmount;
      
      let newPaymentStatus = 'pending';
      if (newPaidAmount >= totalAmount) {
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
      b.phone?.includes(searchTerm) ||
      b.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPaymentStatus = paymentFilter === 'all' || b.paymentStatus === paymentFilter;
    return matchesSearch && matchesPaymentStatus;
  });

  const globalTotalBooked = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const globalTotalCollected = bookings.reduce((sum, b) => sum + (Number(b.paidAmount) || 0), 0);
  const globalTotalPending = globalTotalBooked - globalTotalCollected;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00C9B7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-gray-900">Payment & Balance Collection Manager</h1>
          <p className="text-gray-600 text-xs mt-0.5">{bookings.length} active customer bookings tracked</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Total Bookings Value</span>
            <div className="text-lg font-black text-gray-900 mt-0.5">{formatCurrency(globalTotalBooked)}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Total Collected Funds</span>
            <div className="text-lg font-black text-emerald-700 mt-0.5">{formatCurrency(globalTotalCollected)}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Outstanding Balance Dues</span>
            <div className="text-lg font-black text-rose-700 mt-0.5">{formatCurrency(globalTotalPending)}</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, ref ID, or package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
            />
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] cursor-pointer"
          >
            <option value="all">All Payment Statuses</option>
            <option value="pending">Pending (0 Paid)</option>
            <option value="partial">Partially Paid (Half Payment)</option>
            <option value="paid">Fully Paid</option>
          </select>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-600 text-xs font-bold uppercase tracking-wide border-b border-gray-200 bg-gray-50/50">
                  <th className="px-4 py-3">Ref / Customer</th>
                  <th className="px-4 py-3">Trip Package</th>
                  <th className="px-4 py-3 text-right">Total Package</th>
                  <th className="px-4 py-3 text-right text-emerald-700">Paid Amount</th>
                  <th className="px-4 py-3 text-right text-rose-600">Balance Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => {
                  const { totalAmount, paidAmount, remainingBalance, paymentStatus } = calculateBookingFinances(booking);
                  return (
                    <tr key={booking.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="font-mono text-xs font-bold text-gray-800">{booking.id}</div>
                        <div className="text-gray-900 font-bold text-xs">{booking.name}</div>
                        <div className="text-gray-500 text-[11px]">{booking.phone}</div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="text-gray-900 font-bold text-xs">{booking.tripName}</div>
                        <div className="text-gray-500 text-[11px]">{booking.selectedDate} &bull; {booking.travelers} Persons</div>
                      </td>

                      <td className="px-4 py-3 align-middle text-right font-bold text-xs text-gray-800">
                        {formatCurrency(totalAmount)}
                      </td>

                      <td className="px-4 py-3 align-middle text-right font-bold text-xs text-emerald-700">
                        {formatCurrency(paidAmount)}
                      </td>

                      <td className="px-4 py-3 align-middle text-right font-bold text-xs text-rose-600">
                        {formatCurrency(remainingBalance)}
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          paymentStatus === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {paymentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1.5">
                          {remainingBalance > 0 && (
                            <button
                              onClick={() => handleOpenPaymentModal(booking)}
                              className="bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-1 px-2.5 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Plus size={12} /> Collect Balance
                            </button>
                          )}
                          <button
                            onClick={() => printPaymentReceipt(booking)}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold py-1 px-2 rounded-lg text-[11px] transition-all cursor-pointer flex items-center gap-1"
                            title="Print Payment Receipt"
                          >
                            <Printer size={12} /> Receipt
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredBookings.map((booking) => {
              const { totalAmount, paidAmount, remainingBalance, paymentStatus } = calculateBookingFinances(booking);
              return (
                <div key={booking.id} className="p-4 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs text-gray-500 font-bold">{booking.id}</span>
                      <h4 className="font-bold text-gray-900 text-xs">{booking.name}</h4>
                      <p className="text-gray-500 text-[11px]">{booking.phone}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      paymentStatus === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {paymentStatus}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1 border border-gray-100">
                    <div className="flex justify-between"><span className="text-gray-500">Package:</span><span className="font-bold">{booking.tripName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total Price:</span><span className="font-bold">{formatCurrency(totalAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Collected:</span><span className="text-emerald-700 font-bold">{formatCurrency(paidAmount)}</span></div>
                    <div className="flex justify-between border-t border-gray-200/60 pt-1 font-bold"><span className="text-gray-500">Remaining Balance:</span><span className="text-rose-600">{formatCurrency(remainingBalance)}</span></div>
                  </div>

                  <div className="flex gap-2">
                    {remainingBalance > 0 && (
                      <button
                        onClick={() => handleOpenPaymentModal(booking)}
                        className="flex-1 bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1"
                      >
                        <Plus size={13} /> Collect Balance
                      </button>
                    )}
                    <button
                      onClick={() => printPaymentReceipt(booking)}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1"
                    >
                      <Printer size={13} /> Receipt
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-xs font-medium">No payment records found matching your filter</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Entry Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Record Balance Payment</h3>
                <p className="text-gray-500 text-xs font-mono">Ref ID: {selectedBooking.id}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-6 space-y-3">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Customer:</span><strong className="text-gray-900">{selectedBooking.name} ({selectedBooking.phone})</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Package:</span><strong>{formatCurrency(selectedBooking.amount)}</strong></div>
                <div className="flex justify-between"><span className="text-gray-500">Already Collected:</span><strong className="text-emerald-700">{formatCurrency(selectedBooking.paidAmount || 0)}</strong></div>
                <div className="flex justify-between border-t border-gray-200/60 pt-1 text-rose-700 font-bold">
                  <span>Max Allowable Balance:</span>
                  <span>{formatCurrency((selectedBooking.amount || 0) - (selectedBooking.paidAmount || 0))}</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Amount Collecting (INR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Payment Mode *</label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] cursor-pointer"
                  >
                    <option value="cash">Cash in Office</option>
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="bank">Bank Transfer / NEFT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Transaction Ref / UTR #</label>
                <input
                  type="text"
                  placeholder="e.g. UTR123987456 or Receipt #08"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-xl text-xs hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-2 px-5 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  Save Payment Receipt
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
