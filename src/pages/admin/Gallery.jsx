import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, Image, X, Search, Loader2, AlertCircle, Star } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, uploadCompressedImage } from '../../firebase';
import { getTenantPath } from '../../config/tenant';

const AdminGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    category: 'himalayan',
    featured: false
  });
  const fileInputRef = useRef(null);

  // Subscribe to gallery in real-time with tenant path
  useEffect(() => {
    console.log('Setting up gallery subscription...');
    const galleryPath = getTenantPath('gallery');
    const q = query(collection(db, galleryPath), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Gallery loaded:', data.length);
      setImages(data);
      setLoading(false);
    }, (err) => {
      console.error('Gallery subscription error:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredImages = images.filter(img => 
    img.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    img.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      // Auto-fill title from first file name
      if (!formData.title) {
        const fileName = files[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setFormData(prev => ({ ...prev, title: fileName }));
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const galleryPath = getTenantPath('gallery');
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        console.log(`Uploading image ${i + 1}/${selectedFiles.length}:`, file.name);
        
        const imageName = selectedFiles.length > 1 
          ? `${formData.title} ${i + 1}` 
          : formData.title;
        
        const url = await uploadCompressedImage(file, `gallery/${Date.now()}_${file.name}`, 200);
        
        await addDoc(collection(db, galleryPath), {
          title: imageName,
          url: url,
          category: formData.category,
          featured: formData.featured && i === 0,
          createdAt: new Date().toISOString()
        });

        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      console.log('All images uploaded successfully');
      setShowModal(false);
      setSelectedFiles([]);
      setFormData({ title: '', category: 'himalayan', featured: false });
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload images: ' + (err.message || err));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this image?')) {
      try {
        console.log('Deleting image:', id);
        const galleryPath = getTenantPath('gallery');
        await deleteDoc(doc(db, galleryPath, id));
      } catch (err) {
        console.error('Delete error:', err);
        setError('Failed to delete image');
      }
    }
  };

  const toggleFeatured = async (img) => {
    try {
      console.log('Toggling featured:', img.id);
      const galleryPath = getTenantPath('gallery');
      await updateDoc(doc(db, galleryPath, img.id), { featured: !img.featured });
    } catch (err) {
      console.error('Toggle error:', err);
      setError('Failed to update image');
    }
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
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Gallery Management</h1>
          <p className="text-gray-400 text-xs mt-0.5">{images.length} images</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add Images
        </button>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-750 hover:text-red-950"><X size={18} /></button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Search images..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-semibold">{filteredImages.length} images</span>
              </div>
            </div>
          </div>

          {filteredImages.length === 0 ? (
            <div className="p-12 text-center">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4 font-semibold">No images in gallery yet</p>
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <Plus size={18} className="inline mr-2" /> Add Images
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
              {filteredImages.map((img) => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden border border-gray-250 shadow-sm hover:shadow-md transition-shadow bg-gray-100">
                  <img src={img.url} alt={img.title} className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Hover Quick Actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => toggleFeatured(img)} 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                        img.featured 
                          ? 'bg-yellow-500 text-white border border-yellow-400' 
                          : 'bg-white/90 text-gray-700 hover:bg-yellow-500 hover:text-white border border-gray-200'
                      }`}
                      title={img.featured ? 'Unfeature Image' : 'Feature Image'}
                    >
                      <Star size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(img.id)} 
                      className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-650 hover:bg-red-600 hover:text-white border border-red-200 shadow-lg transition-colors"
                      title="Delete Image"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-sm border-t border-gray-100 flex flex-col">
                    <h4 className="text-gray-900 text-sm font-bold truncate">{img.title}</h4>
                    <span className="text-primary-600 text-xs font-semibold mt-0.5 uppercase tracking-wider">{img.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h2 className="text-xl font-bold text-gray-900">Upload Images</h2>
              <button onClick={() => { setShowModal(false); setSelectedFiles([]); }} className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Drop Zone */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-primary-500 hover:bg-primary-50/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileSelect} 
                  className="hidden" 
                />
                {selectedFiles.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-primary-600 font-bold">{selectedFiles.length} file(s) selected</p>
                    <p className="text-gray-500 text-xs truncate max-w-xs mx-auto">{selectedFiles.map(f => f.name).join(', ')}</p>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFiles([]); }} className="text-red-600 text-sm font-bold hover:underline">
                      Clear selection
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-900 font-bold mb-1">Drag & drop images here</p>
                    <p className="text-gray-400 text-xs mb-3">or</p>
                    <button type="button" className="px-6 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold shadow-sm transition-colors text-sm">
                      Browse Files
                    </button>
                    <p className="text-gray-400 text-xs mt-4">Images will be auto-compressed to 100-200KB</p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-semibold text-sm mb-2">Image Title</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter image title"
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold text-sm mb-2">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                    <option value="himalayan">Himalayan</option>
                    <option value="camping">Camping</option>
                    <option value="weekend">Weekend</option>
                    <option value="winter">Winter</option>
                    <option value="summer">Summer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold text-sm mb-2">Featured</label>
                  <label className="flex items-center gap-3 cursor-pointer mt-3">
                    <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                      className="w-5 h-5 bg-white border-gray-300 rounded text-primary-500 focus:ring-primary-500" />
                    <span className="text-gray-700 font-medium">Mark as featured</span>
                  </label>
                </div>
              </div>

              {uploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-500">Uploading...</span>
                    <span className="text-primary-600">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => { setShowModal(false); setSelectedFiles([]); }} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-400 bg-white transition-colors font-medium">Cancel</button>
                <button type="button" onClick={handleUpload} disabled={uploading || selectedFiles.length === 0} className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Upload className="w-5 h-5" />}
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
