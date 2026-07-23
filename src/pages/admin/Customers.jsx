import { useState, useEffect } from 'react';
import { subscribeToCustomers, saveCustomer, deleteCustomer, subscribeToBookings } from '../../firebase';
import { calculateBookingFinances, formatCurrency } from '../../utils/bookingUtils';
import { Search, Plus, Edit2, Trash2, X, Loader2, User, Phone, MapPin, MessageSquare, Calendar, AlertCircle, History } from 'lucide-react';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    city: '',
    notes: ''
  });

  useEffect(() => {
    const unsubCustomers = subscribeToCustomers((data) => setCustomers(data));
    const unsubBookings = subscribeToBookings((data) => {
      setBookings(data);
      setLoading(false);
    });

    return () => {
      unsubCustomers();
      unsubBookings();
    };
  }, []);

  const handleOpenAdd = () => {
    setSelectedCustomer(null);
    setFormData({ name: '', phone: '', whatsapp: '', city: '', notes: '' });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      city: customer.city || '',
      notes: customer.notes || ''
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenHistory = (customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const handleDelete = async (phone) => {
    if (window.confirm('Are you sure you want to delete this customer? This will not delete their booking records.')) {
      try {
        await deleteCustomer(phone);
      } catch (err) {
        setError('Failed to delete customer.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.phone) {
      setError('Customer Name and Phone Number are required fields.');
      return;
    }

    try {
      await saveCustomer(formData.phone, {
        name: formData.name,
        whatsapp: formData.whatsapp || formData.phone,
        city: formData.city,
        notes: formData.notes
      });
      setShowModal(false);
    } catch (err) {
      setError('Failed to save customer.');
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerHistory = (phone) => {
    return bookings.filter(b => b.phone === phone);
  };

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
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Customer Directory & History</h1>
          <p className="text-gray-600 text-xs mt-0.5">{customers.length} registered customers in database</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers by name, phone number, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
            />
          </div>
        </div>

        {/* List View Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-600 text-xs font-bold uppercase tracking-wide border-b border-gray-200 bg-gray-50/50">
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone & WhatsApp</th>
                  <th className="px-4 py-3">City / Address</th>
                  <th className="px-4 py-3 text-center">Total Bookings</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => {
                  const history = getCustomerHistory(customer.phone);
                  return (
                    <tr key={customer.phone} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0">
                            {customer.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-xs">{customer.name}</div>
                            {customer.email && <div className="text-[11px] text-gray-500">{customer.email}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <a href={`tel:${customer.phone}`} className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1">
                          <Phone size={12} /> {customer.phone}
                        </a>
                        {customer.whatsapp && customer.whatsapp !== customer.phone && (
                          <span className="text-[10px] text-emerald-600 block">WA: {customer.whatsapp}</span>
                        )}
                      </td>

                      <td className="px-4 py-3 align-middle text-gray-700 text-xs">
                        {customer.city ? (
                          <span className="flex items-center gap-1 text-gray-800 font-medium">
                            <MapPin size={12} className="text-gray-400" /> {customer.city}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">N/A</span>
                        )}
                      </td>

                      <td className="px-4 py-3 align-middle text-center">
                        <button
                          onClick={() => handleOpenHistory(customer)}
                          className="inline-flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold px-2.5 py-1 rounded-full transition-all cursor-pointer"
                        >
                          <Calendar size={12} /> {history.length} Bookings
                        </button>
                      </td>

                      <td className="px-4 py-3 align-middle text-gray-600 text-xs max-w-[200px] truncate">
                        {customer.notes || 'N/A'}
                      </td>

                      <td className="px-4 py-3 align-middle text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(customer)}
                            className="p-1.5 text-gray-400 hover:text-[#00C9B7] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Customer"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.phone)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Delete Customer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredCustomers.map(customer => {
              const history = getCustomerHistory(customer.phone);
              return (
                <div key={customer.phone} className="p-3.5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {customer.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-xs">{customer.name}</h4>
                        <a href={`tel:${customer.phone}`} className="text-[11px] font-bold text-sky-600">{customer.phone}</a>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOpenEdit(customer)} className="p-1 text-gray-400 hover:text-[#00C9B7]">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(customer.phone)} className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-2.5 text-xs space-y-1 border border-gray-100">
                    {customer.city && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">City / Address:</span>
                        <span className="font-medium text-gray-800">{customer.city}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-gray-200/60">
                      <span className="text-gray-500">Trip History:</span>
                      <button
                        onClick={() => handleOpenHistory(customer)}
                        className="font-bold text-sky-600 underline"
                      >
                        {history.length} Bookings Registered
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-gray-800 font-bold text-xs mb-1">No customer records found</h3>
              <p className="text-gray-500 text-xs">Customers are auto-saved upon reservation or can be added manually.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">
                {selectedCustomer ? 'Edit Customer Record' : 'Add New Customer Profile'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!!selectedCustomer}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7] disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Chhatrapati Sambhajinagar (Aurangabad)"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Notes / Preferences</label>
                <textarea
                  placeholder="e.g. Frequent trekker, prefers front bus seats..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7] h-20 resize-none"
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Booking History Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Customer Tour History</h3>
                <p className="text-gray-500 text-xs">{selectedCustomer.name} ({selectedCustomer.phone})</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {getCustomerHistory(selectedCustomer.phone).map(booking => {
                const { totalAmount, paidAmount, remainingBalance, paymentStatus } = calculateBookingFinances(booking);
                return (
                  <div key={booking.id} className="bg-gray-50 border border-gray-150 rounded-2xl p-4 text-xs space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-gray-500 font-bold">{booking.id}</span>
                        <h4 className="font-bold text-gray-900 text-xs mt-0.5">{booking.tripName}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        paymentStatus === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {paymentStatus}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Departure: <strong>{booking.selectedDate}</strong></span>
                      <span>Travelers: <strong>{booking.travelers} Persons</strong></span>
                    </div>

                    <div className="flex justify-between border-t border-gray-200/60 pt-1.5 font-semibold text-gray-800">
                      <span>Total Package: {formatCurrency(totalAmount)}</span>
                      <span className="text-emerald-700">Paid: {formatCurrency(paidAmount)}</span>
                    </div>
                  </div>
                );
              })}

              {getCustomerHistory(selectedCustomer.phone).length === 0 && (
                <div className="text-center py-8 text-gray-500 text-xs">
                  No past tour bookings registered for this customer yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;
