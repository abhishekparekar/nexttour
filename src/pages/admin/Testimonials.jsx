import { useState, useEffect } from 'react';
import { Plus, Star, Trash2, X, Edit, Loader2, AlertCircle, Upload } from 'lucide-react';
import { subscribeToTestimonials, addTestimonial, updateTestimonial, deleteTestimonial, uploadCompressedImage } from '../../firebase';

const AdminTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    location: '',
    rating: 5,
    avatar: '',
    text: '',
    status: 'active'
  });

  // Subscribe to testimonials in real-time
  useEffect(() => {
    console.log('Setting up testimonials subscription...');
    const unsubscribe = subscribeToTestimonials((data) => {
      console.log('Testimonials data received:', data);
      setTestimonials(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      console.log('Uploading avatar:', file.name);
      const url = await uploadCompressedImage(file, `testimonials/${Date.now()}_${file.name}`, 100);
      console.log('Avatar uploaded:', url);
      setFormData(prev => ({ ...prev, avatar: url }));
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image: ' + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const testimonialData = {
        name: formData.name,
        role: formData.role,
        location: formData.location,
        rating: parseInt(formData.rating),
        avatar: formData.avatar,
        text: formData.text,
        status: formData.status
      };

      console.log('Saving testimonial:', testimonialData);

      if (editingId) {
        await updateTestimonial(editingId, testimonialData);
      } else {
        await addTestimonial(testimonialData);
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save testimonial');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (testimonial) => {
    console.log('Editing testimonial:', testimonial);
    setEditingId(testimonial.id);
    setFormData({
      name: testimonial.name || '',
      role: testimonial.role || '',
      location: testimonial.location || '',
      rating: testimonial.rating || 5,
      avatar: testimonial.avatar || '',
      text: testimonial.text || '',
      status: testimonial.status || 'active'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      try {
        console.log('Deleting testimonial:', id);
        await deleteTestimonial(id);
      } catch (err) {
        console.error('Delete error:', err);
        setError('Failed to delete testimonial');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      location: '',
      rating: 5,
      avatar: '',
      text: '',
      status: 'active'
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingId(null);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Testimonials</h1>
          <p className="text-gray-500 text-sm mt-0.5">{testimonials.length} testimonials</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Testimonial
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-750 hover:text-red-950"><X size={18} /></button>
          </div>
        )}

        {testimonials.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-500 mb-4 font-semibold">No testimonials yet. Add your first one!</p>
            <button onClick={openAddModal} className="btn-primary">
              <Plus size={18} className="inline mr-2" /> Add Testimonial
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 relative">
                <div className="flex items-start gap-4 mb-4">
                  {testimonial.avatar ? (
                    <img src={testimonial.avatar} alt={testimonial.name} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-primary-650 font-bold border border-gray-200 text-primary-600">
                      {testimonial.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-gray-900 font-bold">{testimonial.name}</h3>
                    <p className="text-gray-500 text-xs mt-0.5 font-medium">{testimonial.role}</p>
                    <p className="text-gray-500 text-xs font-medium">{testimonial.location}</p>
                  </div>
                  <span className={`ml-auto px-2 py-1 rounded text-xs font-semibold ${testimonial.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                    {testimonial.status}
                  </span>
                </div>

                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{testimonial.text}"</p>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button onClick={() => handleEdit(testimonial)} className="flex-1 py-2 bg-primary-50 rounded-lg text-primary-600 text-sm hover:bg-primary-100 border border-primary-100 transition-colors flex items-center justify-center gap-1 font-semibold">
                    <Edit size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(testimonial.id)} className="flex-1 py-2 bg-red-50 rounded-lg text-red-600 text-sm hover:bg-red-100 border border-red-100 transition-colors flex items-center justify-center gap-1 font-semibold">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-750 font-semibold text-sm mb-2">Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-gray-750 font-semibold text-sm mb-2">Role</label>
                  <input type="text" name="role" value={formData.role} onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-750 font-semibold text-sm mb-2">Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-gray-750 font-semibold text-sm mb-2">Rating</label>
                  <select name="rating" value={formData.rating} onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-750 font-semibold text-sm mb-2">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-755 font-semibold text-sm mb-2">Avatar</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="text-gray-500 text-sm font-semibold">{formData.avatar ? 'Change' : 'Upload'}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    {formData.avatar && (
                      <img src={formData.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-gray-750 font-semibold text-sm mb-2">Review Text *</label>
                <textarea name="text" value={formData.text} onChange={handleInputChange} rows={4} required
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" />
              </div>
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-400 bg-white transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : null}
                  {saving ? 'Saving...' : (editingId ? 'Update' : 'Add Testimonial')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
