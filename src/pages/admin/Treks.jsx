import { useState } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';

const sampleTreks = [
  { id: '1', title: 'Himalayan Summit Expedition', location: 'Manali, HP', price: 15999, duration: '7 Days', difficulty: 'Difficult', status: 'active', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400' },
  { id: '2', title: 'Valley of Flowers Trek', location: 'Uttarakhand', price: 8999, duration: '5 Days', difficulty: 'Moderate', status: 'active', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400' },
  { id: '3', title: 'Kedarkantha Winter Trek', location: 'Uttarakhand', price: 6999, duration: '4 Days', difficulty: 'Moderate', status: 'active', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400' },
  { id: '4', title: 'Spiti Valley Adventure', location: 'Himachal Pradesh', price: 18999, duration: '8 Days', difficulty: 'Difficult', status: 'draft', image: 'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=400' }
];

const AdminTreks = () => {
  const [treks, setTreks] = useState(sampleTreks);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTrek, setEditingTrek] = useState(null);

  const filteredTreks = treks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.location.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this trek?')) {
      setTreks(treks.filter(t => t.id !== id));
    }
  };

  const handleEdit = (trek) => {
    setEditingTrek(trek);
    setShowModal(true);
  };

  const difficultyColors = { 
    Easy: 'bg-green-50 text-green-700 border border-green-200', 
    Moderate: 'bg-yellow-50 text-yellow-700 border border-yellow-200', 
    Difficult: 'bg-red-50 text-red-700 border border-red-200', 
    Expert: 'bg-purple-50 text-purple-700 border border-purple-200' 
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-gray-900">Manage Treks</h1>
          <p className="text-gray-600 text-xs mt-0.5">Add, edit, or remove trekking packages</p>
        </div>
        <button onClick={() => { setEditingTrek(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add New Trek
        </button>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search treks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b border-gray-200 bg-gray-50/50">
                  <th className="p-6 font-semibold">Trek</th>
                  <th className="p-6 font-semibold">Location</th>
                  <th className="p-6 font-semibold">Price</th>
                  <th className="p-6 font-semibold">Duration</th>
                  <th className="p-6 font-semibold">Difficulty</th>
                  <th className="p-6 font-semibold">Status</th>
                  <th className="p-6 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTreks.map((trek) => (
                  <tr key={trek.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <img src={trek.image} alt={trek.title} className="w-16 h-12 rounded-lg object-cover bg-gray-100" />
                        <div>
                          <div className="text-gray-900 font-semibold">{trek.title}</div>
                          <div className="text-gray-600 text-sm">ID: {trek.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-gray-700">{trek.location}</td>
                    <td className="p-6 text-gray-900 font-bold">₹{trek.price.toLocaleString()}</td>
                    <td className="p-6 text-gray-700">{trek.duration}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[trek.difficulty]}`}>{trek.difficulty}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${trek.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        {trek.status.charAt(0).toUpperCase() + trek.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(trek)} className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 hover:bg-primary-100 border border-primary-100 transition-colors">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(trek.id)} className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-650 hover:bg-red-100 border border-red-100 transition-colors">
                          <Trash2 size={18} className="text-red-650" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{editingTrek ? 'Edit Trek' : 'Add New Trek'}</h2>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form className="p-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold text-sm mb-2">Trek Title *</label>
                  <input type="text" defaultValue={editingTrek?.title || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold text-sm mb-2">Location *</label>
                  <input type="text" defaultValue={editingTrek?.location || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold text-sm mb-2">Price (₹) *</label>
                  <input type="number" defaultValue={editingTrek?.price || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold text-sm mb-2">Duration *</label>
                  <input type="text" defaultValue={editingTrek?.duration || ''} placeholder="e.g., 5 Days" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold text-sm mb-2">Difficulty *</label>
                  <select defaultValue={editingTrek?.difficulty || 'Moderate'} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                    <option>Easy</option><option>Moderate</option><option>Difficult</option><option>Expert</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-semibold text-sm mb-2">Image URL *</label>
                  <input type="url" defaultValue={editingTrek?.image || ''} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                </div>
              </div>
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-400 bg-white transition-colors font-medium">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">{editingTrek ? 'Save Changes' : 'Add Trek'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTreks;
