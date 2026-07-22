import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Loader2, Truck, Phone, MessageSquare, AlertCircle } from 'lucide-react';
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
      setError('Name, Number and Capacity are required fields.');
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
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600 text-xs mt-0.5">{vehicles.length} vehicles registered</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#00C9B7] hover:bg-[#00b3a2] text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all shadow-md"
        >
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      <div className="p-4">
        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, number, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredVehicles.map(vehicle => (
            <div key={vehicle.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                    <Truck size={20} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(vehicle)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(vehicle.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{vehicle.name}</h3>
                <div className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider mb-4">
                  {vehicle.number}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Capacity:</span>
                    <span className="font-bold text-gray-900">{vehicle.capacity} seats</span>
                  </div>
                  {vehicle.contact && (
                    <div className="flex items-center justify-between">
                      <span>Owner/Contact:</span>
                      <a href={`tel:${vehicle.contact}`} className="font-semibold text-primary-600 hover:underline flex items-center gap-1">
                        <Phone size={13} /> {vehicle.contact}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {vehicle.notes && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-500">
                  <MessageSquare size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
                  <p className="line-clamp-2 leading-relaxed">{vehicle.notes}</p>
                </div>
              )}
            </div>
          ))}

          {filteredVehicles.length === 0 && (
            <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 font-semibold mb-1">No vehicles found</h3>
              <p className="text-gray-600 text-sm">Create a new vehicle to associate it with scheduled trips.</p>
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
                {editingVehicle ? 'Edit Vehicle Details' : 'Add New Vehicle'}
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
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Vehicle Name / Type *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Force Traveller, Toyota Innova"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Vehicle Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH12AA1234"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value.toUpperCase() })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Capacity (Seats) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 17"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Contact Details</label>
                <input
                  type="tel"
                  placeholder="e.g. Owner phone number"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Notes</label>
                <textarea
                  placeholder="Any extra details like registration info, permit, etc."
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
                  {editingVehicle ? 'Save Changes' : 'Create Vehicle'}
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
