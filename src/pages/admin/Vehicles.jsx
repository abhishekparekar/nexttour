import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Loader2, Truck, Phone, MessageSquare, AlertCircle, Users } from 'lucide-react';
import { subscribeToVehicles, addVehicle, updateVehicle, deleteVehicle } from '../../firebase';

const AdminVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    capacity: '',
    contact: '',
    notes: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeToVehicles((data) => {
      setVehicles(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setFormData({ name: '', number: '', capacity: '', contact: '', notes: '' });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name || '',
      number: vehicle.number || '',
      capacity: vehicle.capacity || '',
      contact: vehicle.contact || '',
      notes: vehicle.notes || ''
    });
    setError(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await deleteVehicle(id);
      } catch (err) {
        setError('Failed to delete vehicle');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name || !formData.number || !formData.capacity) {
      setError('Vehicle Name, Registration Number, and Seating Capacity are required.');
      return;
    }

    try {
      const data = {
        ...formData,
        capacity: Number(formData.capacity)
      };

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, data);
      } else {
        await addVehicle(data);
      }
      setShowModal(false);
    } catch (err) {
      setError('Failed to save vehicle details.');
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.contact?.includes(searchTerm)
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
          <h1 className="text-base font-bold text-gray-900">Vehicle Fleet Management</h1>
          <p className="text-gray-600 text-xs mt-0.5">{vehicles.length} active transport vehicles registered</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
        >
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles by name, reg number, or owner contact..."
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
                  <th className="px-4 py-3">Vehicle Details</th>
                  <th className="px-4 py-3">Reg. Number</th>
                  <th className="px-4 py-3 text-center">Seating Capacity</th>
                  <th className="px-4 py-3">Owner / Contact</th>
                  <th className="px-4 py-3">Notes & Amenities</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(vehicle => (
                  <tr key={vehicle.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Truck size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs">{vehicle.name}</div>
                          <span className="text-[10px] text-gray-500 font-mono">ID: {vehicle.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-middle">
                      <span className="inline-block bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-md font-mono font-bold uppercase border border-slate-200">
                        {vehicle.number}
                      </span>
                    </td>

                    <td className="px-4 py-3 align-middle text-center">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                        <Users size={12} /> {vehicle.capacity} Seats
                      </span>
                    </td>

                    <td className="px-4 py-3 align-middle">
                      {vehicle.contact ? (
                        <a href={`tel:${vehicle.contact}`} className="text-xs font-bold text-sky-700 hover:underline flex items-center gap-1">
                          <Phone size={12} /> {vehicle.contact}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No contact logged</span>
                      )}
                    </td>

                    <td className="px-4 py-3 align-middle text-gray-600 text-xs max-w-[250px] truncate">
                      {vehicle.notes || 'N/A'}
                    </td>

                    <td className="px-4 py-3 align-middle text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(vehicle)}
                          className="p-1.5 text-gray-400 hover:text-[#00C9B7] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Vehicle"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Delete Vehicle"
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
            {filteredVehicles.map(vehicle => (
              <div key={vehicle.id} className="p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Truck size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{vehicle.name}</h4>
                      <span className="inline-block bg-slate-100 text-slate-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                        {vehicle.number}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(vehicle)} className="p-1 text-gray-400 hover:text-[#00C9B7]">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(vehicle.id)} className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-2.5 text-xs space-y-1 border border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seating Capacity:</span>
                    <span className="font-bold text-emerald-700">{vehicle.capacity} Seats</span>
                  </div>
                  {vehicle.contact && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Owner Contact:</span>
                      <a href={`tel:${vehicle.contact}`} className="font-bold text-sky-600">{vehicle.contact}</a>
                    </div>
                  )}
                  {vehicle.notes && (
                    <div className="border-t border-gray-200/60 pt-1 mt-1 text-gray-600 text-[11px]">
                      <strong>Notes:</strong> {vehicle.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-12">
              <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-gray-800 font-bold text-xs mb-1">No vehicles found</h3>
              <p className="text-gray-500 text-xs">Add vehicles to assign to trip departure schedules.</p>
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
                {editingVehicle ? 'Edit Vehicle Details' : 'Add New Fleet Vehicle'}
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
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Vehicle Name / Model *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Force Traveler AC Executive"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Reg Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH 20 EG 4444"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7] uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Capacity (Seats) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 17"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Owner Contact / Phone</label>
                <input
                  type="text"
                  placeholder="e.g. +91 9876543210"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Notes / Features</label>
                <textarea
                  placeholder="e.g. Pushback seats, Bluetooth music, Luggage carrier..."
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
                  {editingVehicle ? 'Save Changes' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVehicles;
