import { useState, useEffect } from 'react';
import { subscribeToCustomers, saveCustomer, deleteCustomer, subscribeToBookings } from '../../firebase';
import { Search, Plus, Edit2, Trash2, X, Loader2, User, Phone, MapPin, MessageSquare, Calendar, AlertCircle } from 'lucide-react';

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
      setError('Name and Phone Number are required fields.');
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
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{customers.length} registered customers</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md"
        >
          <Plus size={18} /> Add Customer
        </button>
      </div>

      <div className="p-6">
        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone number, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Customer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => {
            const history = getCustomerHistory(customer.phone);
            return (
              <div key={customer.phone} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center font-bold text-lg">
                      {customer.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleOpenEdit(customer)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(customer.phone)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-1 leading-tight">{customer.name}</h3>

                  <div className="space-y-2 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400" />
                      <a href={`tel:${customer.phone}`} className="hover:text-primary-600 hover:underline">{customer.phone}</a>
                    </div>
                    {customer.city && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span>{customer.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenHistory(customer)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 bg-primary-50 py-1 px-3 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Calendar size={13} /> {history.length} Bookings
                  </button>
                  {customer.notes && (
                    <span className="text-[10px] text-gray-400 italic max-w-[120px] truncate" title={customer.notes}>
                      {customer.notes}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredCustomers.length === 0 && (
            <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 font-semibold mb-1">No customers found</h3>
              <p className="text-gray-500 text-sm">Customers are registered automatically on booking or can be manually added.</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">
                {selectedCustomer ? 'Edit Customer Settings' : 'Create Customer Profile'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditi Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Phone Number *</label>
                <input
                  type="tel"
                  required
                  disabled={!!selectedCustomer}
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="e.g. WhatsApp number (optional)"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Address / City</label>
                <input
                  type="text"
                  placeholder="e.g. Aurangabad, MH"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Internal Notes</label>
                <textarea
                  placeholder="Health notes, food preferences, cancellation records, etc..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white h-20 resize-none"
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
                  {selectedCustomer ? 'Save Details' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking History Modal */}
      {showHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Booking History</h3>
                <p className="text-gray-500 text-xs">{selectedCustomer.name}'s departures</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {getCustomerHistory(selectedCustomer.phone).map(b => (
                <div key={b.id} className="p-4 border border-gray-200 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-gray-900 text-[14px]">{b.tripName}</h4>
                    <div className="text-gray-500 text-xs mt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Date: <strong>{b.selectedDate}</strong></span>
                      <span>Travelers: <strong>{b.travelers}</strong></span>
                      <span>Booking Date: {b.bookingDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="block text-[14px] font-black text-gray-900">₹{b.amount?.toLocaleString()}</span>
                      <span className="block text-[10px] text-green-600 font-bold">Paid: ₹{(b.paidAmount || 0).toLocaleString()}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      b.status === 'confirmed' ? 'bg-green-50 text-green-700 border border-green-200' :
                      b.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}

              {getCustomerHistory(selectedCustomer.phone).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p>No bookings found for this customer.</p>
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
