import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Loader2, UserCheck, Phone, AlertCircle, MessageSquare, Truck } from 'lucide-react';
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
    if (window.confirm('Are you sure you want to delete this driver profile?')) {
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
        <Loader2 className="w-8 h-8 text-[#00C9B7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Drivers & Tour Guides Staff</h1>
          <p className="text-gray-600 text-xs mt-0.5">{drivers.length} registered drivers & trip leaders</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Add Driver / Guide
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by driver name, phone number, or assigned vehicle..."
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
                  <th className="px-4 py-3">Driver Name</th>
                  <th className="px-4 py-3">Contact Phone</th>
                  <th className="px-4 py-3">Assigned Vehicle</th>
                  <th className="px-4 py-3">Notes & License Details</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map(driver => (
                  <tr key={driver.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#00C9B7]/10 text-[#00C9B7] rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {driver.name?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs">{driver.name}</div>
                          <span className="text-[10px] text-gray-500 font-mono">ID: {driver.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-middle">
                      <a href={`tel:${driver.phone}`} className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1">
                        <Phone size={12} /> {driver.phone}
                      </a>
                    </td>

                    <td className="px-4 py-3 align-middle">
                      {driver.vehicleName ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200">
                          <Truck size={12} /> {driver.vehicleName}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="px-4 py-3 align-middle text-gray-600 text-xs max-w-[250px] truncate">
                      {driver.notes || 'N/A'}
                    </td>

                    <td className="px-4 py-3 align-middle text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(driver)}
                          className="p-1.5 text-gray-400 hover:text-[#00C9B7] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Driver"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Delete Driver"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredDrivers.map(driver => (
              <div key={driver.id} className="p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-[#00C9B7]/10 text-[#00C9B7] rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {driver.name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{driver.name}</h4>
                      <a href={`tel:${driver.phone}`} className="text-[11px] font-bold text-sky-600">{driver.phone}</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(driver)} className="p-1 text-gray-400 hover:text-[#00C9B7]">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(driver.id)} className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-2.5 text-xs space-y-1 border border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehicle:</span>
                    <span className="font-bold text-gray-800">{driver.vehicleName || 'Unassigned'}</span>
                  </div>
                  {driver.notes && (
                    <div className="border-t border-gray-200/60 pt-1 mt-1 text-gray-600 text-[11px]">
                      <strong>Notes:</strong> {driver.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredDrivers.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-gray-800 font-bold text-xs mb-1">No driver records found</h3>
              <p className="text-gray-500 text-xs">Add drivers or guides to assign to tour departures.</p>
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
                {editingDriver ? 'Edit Driver Details' : 'Add New Driver / Guide'}
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
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Driver / Leader Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Shinde"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 9156434444"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Assign Primary Vehicle</label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] cursor-pointer"
                >
                  <option value="">-- No Primary Vehicle Assigned --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.number})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">License & Notes</label>
                <textarea
                  placeholder="e.g. Commercial DL #MH20-12345, Heavy vehicle certified..."
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
                  {editingDriver ? 'Save Changes' : 'Save Driver'}
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
