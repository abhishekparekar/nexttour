import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Loader2, UserCheck, Phone, AlertCircle, MessageSquare } from 'lucide-react';
import { subscribeToDrivers, addDriver, updateDriver, deleteDriver, subscribeToVehicles } from '../../firebase';

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleId: '',
    notes: ''
  });

  useEffect(() => {
    const unsubDrivers = subscribeToDrivers((data) => {
      setDrivers(data);
    });

    const unsubVehicles = subscribeToVehicles((data) => {
      setVehicles(data);
      setLoading(false);
    });

    return () => {
      unsubDrivers();
      unsubVehicles();
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormData({ name: '', phone: '', vehicleId: '', notes: '' });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || '',
      phone: driver.phone || '',
      vehicleId: driver.vehicleId || '',
      notes: driver.notes || ''
    });
    setError(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await deleteDriver(id);
      } catch (err) {
        setError('Failed to delete driver');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.phone) {
      setError('Driver Name and Phone Number are required fields.');
      return;
    }

    try {
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
      const data = {
        ...formData,
        vehicleName: selectedVehicle ? `${selectedVehicle.name} (${selectedVehicle.number})` : ''
      };

      if (editingDriver) {
        await updateDriver(editingDriver.id, data);
      } else {
        await addDriver(data);
      }
      setShowModal(false);
    } catch (err) {
      setError('Failed to save driver details.');
    }
  };

  const filteredDrivers = drivers.filter(d =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone?.includes(searchTerm) ||
    d.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-base font-bold text-gray-900">Driver Management</h1>
          <p className="text-gray-600 text-xs mt-0.5">{drivers.length} drivers registered</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#00C9B7] hover:bg-[#00b3a2] text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all shadow-md"
        >
          <Plus size={18} /> Add Driver
        </button>
      </div>

      <div className="p-4">
        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by driver name, phone, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDrivers.map(driver => (
            <div key={driver.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                    <UserCheck size={20} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(driver)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(driver.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2">{driver.name}</h3>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Phone:</span>
                    <a href={`tel:${driver.phone}`} className="font-semibold text-primary-600 hover:underline flex items-center gap-1">
                      <Phone size={13} /> {driver.phone}
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Assigned Vehicle:</span>
                    <span className="font-semibold text-gray-900">{driver.vehicleName || 'None'}</span>
                  </div>
                </div>
              </div>

              {driver.notes && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-500">
                  <MessageSquare size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
                  <p className="line-clamp-2 leading-relaxed">{driver.notes}</p>
                </div>
              )}
            </div>
          ))}

          {filteredDrivers.length === 0 && (
            <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 font-semibold mb-1">No drivers found</h3>
              <p className="text-gray-600 text-sm">Create a new driver to associate them with vehicles and schedules.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingDriver ? 'Edit Driver Details' : 'Add New Driver'}
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
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Driver Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Contact Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Assigned Vehicle</label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white cursor-pointer"
                >
                  <option value="">-- No Assigned Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Notes</label>
                <textarea
                  placeholder="License number, driver badge, alternate contact details, etc."
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
                  {editingDriver ? 'Save Changes' : 'Create Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDrivers;
