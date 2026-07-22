import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Upload, Calendar, ChevronDown, ChevronUp, PlusCircle, Trash, CheckCircle, Loader2, AlertCircle, Send } from 'lucide-react';
import { deleteTrip, updateTrip, addTrip, uploadCompressedImage, subscribeToTrips, subscribeToCategories } from '../../firebase';

const isSaturday = (dateStr) => {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return dateObj.getDay() === 6;
};

const AdminTrips = () => {
  const [trips, setTrips] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [newDateInput, setNewDateInput] = useState('');
  const [newTimeInput, setNewTimeInput] = useState('');
  const [newLocationInput, setNewLocationInput] = useState('');
  const [selectedDays, setSelectedDays] = useState([6, 0]); // Saturday & Sunday by default
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(8); // 8 weeks (2 months) by default
  const [expandedSections, setExpandedSections] = useState(['basic']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubTrips = subscribeToTrips((data) => {
      setTrips(data);
    });

    const unsubCategories = subscribeToCategories((data) => {
      setCategories(data);
      setLoading(false);
    });

    return () => {
      unsubTrips();
      unsubCategories();
    };
  }, []);

  const filteredTrips = trips.filter(t => 
    t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      try {
        await deleteTrip(id);
      } catch (err) {
        setError('Failed to delete trip');
      }
    }
  };

  const handleShareWhatsApp = (trip) => {
    const packageUrl = `${window.location.origin}/trip/${trip.id}`;
    const message = `Hello!\n\nCheck out our amazing tour package *${trip.title}* at *${trip.location}*! 🗺️🏔️\n\n*Price:* ₹${trip.price?.toLocaleString()}\n*Duration:* ${trip.nights || 0}N/${trip.days || 1}D\n\nClick the link below for more details and direct booking:\n${packageUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEdit = (trip) => {
    const deepCopy = JSON.parse(JSON.stringify(trip));
    deepCopy.highlights = (deepCopy.highlights || []).join(', ');
    deepCopy.inclusions = (deepCopy.inclusions || []).join(', ');
    deepCopy.exclusions = (deepCopy.exclusions || []).join(', ');
    deepCopy.thingsToCarry = (deepCopy.thingsToCarry || []).join(', ');
    deepCopy.cancellationPolicy = (deepCopy.cancellationPolicy || []).join(', ');
    deepCopy.rules = (deepCopy.rules || []).join(', ');
    deepCopy.placesCovered = (deepCopy.placesCovered || []).join(', ');
    deepCopy.importantInstructions = (deepCopy.importantInstructions || []).join(', ');
    setEditingTrip(deepCopy);
    setNewDateInput('');
    setNewTimeInput('');
    setNewLocationInput('');
    setShowModal(true);
    setError(null);
  };

  const handleAddNew = () => {
    const firstCategory = categories[0] || {};
    const newTrip = {
      title: '',
      location: '',
      categoryId: firstCategory.id || 'himalayan',
      categoryName: firstCategory.title || firstCategory.name || 'Himalayan Adventure',
      price: 0,
      nights: 0,
      days: 0,
      rating: 0,
      difficulty: 'Moderate',
      maxGroupSize: 15,
      minAge: 18,
      maxAltitude: '0m',
      status: 'active',
      featured: false,
      upcoming: false,
      images: [],
      description: '',
      highlights: '',
      inclusions: '',
      exclusions: '',
      itinerary: [],
      addons: [],
      availableDates: [],
      thingsToCarry: '',
      cancellationPolicy: '',
      rules: '',
      pickupLocations: [],
      hotelDetails: '',
      foodDetails: '',
      placesCovered: '',
      importantInstructions: ''
    };
    setEditingTrip(newTrip);
    setNewDateInput('');
    setNewTimeInput('');
    setNewLocationInput('');
    setShowModal(true);
    setError(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadCompressedImage(file, `trips/${Date.now()}_${file.name}`, 200);
      setEditingTrip(prev => ({ ...prev, images: [...(prev.images || []), url] }));
    } catch (err) {
      console.error(err);
      setError('Failed to upload image: ' + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = editingTrip.images.filter((_, i) => i !== index);
    setEditingTrip({ ...editingTrip, images: newImages });
  };

  const handleCategoryChange = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    setEditingTrip(prev => ({ 
      ...prev, 
      categoryId,
      categoryName: category?.title || category?.name || categoryId
    }));
  };

  const handleSave = async () => {
    if (!editingTrip.title) {
      setError('Trip title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Find the selected category to get its name
      const selectedCategory = categories.find(c => c.id === editingTrip.categoryId);
      
      // Sort itinerary chronologically by day before saving
      const sortedItinerary = [...(editingTrip.itinerary || [])].sort((a, b) => (Number(a.day) || 0) - (Number(b.day) || 0));

      // Prepare trip data with both categoryId and categoryName
      const tripData = {
        ...editingTrip,
        featured: !!editingTrip.featured,
        upcoming: !!editingTrip.upcoming,
        days: Number(editingTrip.days) || (Number(editingTrip.nights) || 0) + 1,
        nights: Number(editingTrip.nights) || 0,
        highlights: typeof editingTrip.highlights === 'string'
          ? editingTrip.highlights.split(',').map(h => h.trim()).filter(Boolean)
          : (editingTrip.highlights || []),
        inclusions: typeof editingTrip.inclusions === 'string'
          ? editingTrip.inclusions.split(',').map(i => i.trim()).filter(Boolean)
          : (editingTrip.inclusions || []),
        exclusions: typeof editingTrip.exclusions === 'string'
          ? editingTrip.exclusions.split(',').map(e => e.trim()).filter(Boolean)
          : (editingTrip.exclusions || []),
        thingsToCarry: typeof editingTrip.thingsToCarry === 'string'
          ? editingTrip.thingsToCarry.split(',').map(t => t.trim()).filter(Boolean)
          : (editingTrip.thingsToCarry || []),
        cancellationPolicy: typeof editingTrip.cancellationPolicy === 'string'
          ? editingTrip.cancellationPolicy.split(',').map(c => c.trim()).filter(Boolean)
          : (editingTrip.cancellationPolicy || []),
        rules: typeof editingTrip.rules === 'string'
          ? editingTrip.rules.split(',').map(r => r.trim()).filter(Boolean)
          : (editingTrip.rules || []),
        placesCovered: typeof editingTrip.placesCovered === 'string'
          ? editingTrip.placesCovered.split(',').map(p => p.trim()).filter(Boolean)
          : (editingTrip.placesCovered || []),
        importantInstructions: typeof editingTrip.importantInstructions === 'string'
          ? editingTrip.importantInstructions.split(',').map(i => i.trim()).filter(Boolean)
          : (editingTrip.importantInstructions || []),
        hotelDetails: editingTrip.hotelDetails || '',
        foodDetails: editingTrip.foodDetails || '',
        itinerary: sortedItinerary,
        categoryId: editingTrip.categoryId,
        categoryName: selectedCategory?.title || selectedCategory?.name || editingTrip.categoryId
      };

      // Clean undefined fields to prevent Firestore errors
      Object.keys(tripData).forEach(key => {
        if (tripData[key] === undefined) {
          delete tripData[key];
        }
      });

      if (editingTrip.id) {
        await updateTrip(editingTrip.id, tripData);
      } else {
        await addTrip(tripData);
      }
      setShowModal(false);
    } catch (err) {
      setError('Failed to save trip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditingTrip(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'nights') {
        const prevNights = prev.nights || 0;
        const prevDays = prev.days || 0;
        if (prevDays === 0 || prevDays === prevNights + 1) {
          updated.days = value + 1;
        }
      }
      return updated;
    });
  };

  const handleAddItem = (field, defaultValue = '') => {
    setEditingTrip(prev => ({ 
      ...prev, 
      [field]: [...(prev[field] || []), defaultValue] 
    }));
  };

  const handleItemChange = (field, index, value) => {
    const newItems = [...(editingTrip[field] || [])];
    newItems[index] = value;
    setEditingTrip({ ...editingTrip, [field]: newItems });
  };

  const handleRemoveItem = (field, index) => {
    const newItems = (editingTrip[field] || []).filter((_, i) => i !== index);
    setEditingTrip({ ...editingTrip, [field]: newItems });
  };

  const handleAddItinerary = () => {
    const currentItinerary = editingTrip.itinerary || [];
    const newDay = currentItinerary.length > 0 
      ? currentItinerary[currentItinerary.length - 1].day + 1 
      : 1;
    setEditingTrip({ 
      ...editingTrip, 
      itinerary: [...currentItinerary, { day: newDay, title: '', description: '' }] 
    });
  };

  const handleItineraryChange = (index, field, value) => {
    const newItinerary = [...(editingTrip.itinerary || [])];
    newItinerary[index] = { 
      ...newItinerary[index], 
      [field]: field === 'day' ? parseInt(value) || 1 : value 
    };
    setEditingTrip({ ...editingTrip, itinerary: newItinerary });
  };

  const handleRemoveItinerary = (index) => {
    const newItinerary = editingTrip.itinerary.filter((_, i) => i !== index);
    setEditingTrip({ ...editingTrip, itinerary: newItinerary });
  };

  const handleMoveItinerary = (index, direction) => {
    const newItinerary = [...(editingTrip.itinerary || [])];
    if (direction === 'up' && index > 0) {
      const temp = newItinerary[index];
      newItinerary[index] = newItinerary[index - 1];
      newItinerary[index - 1] = temp;
      
      const tempDay = newItinerary[index].day;
      newItinerary[index].day = newItinerary[index - 1].day;
      newItinerary[index - 1].day = tempDay;
    } else if (direction === 'down' && index < newItinerary.length - 1) {
      const temp = newItinerary[index];
      newItinerary[index] = newItinerary[index + 1];
      newItinerary[index + 1] = temp;

      const tempDay = newItinerary[index].day;
      newItinerary[index].day = newItinerary[index + 1].day;
      newItinerary[index + 1].day = tempDay;
    }
    setEditingTrip({ ...editingTrip, itinerary: newItinerary });
  };

  const handleAddAddon = () => {
    setEditingTrip({ 
      ...editingTrip, 
      addons: [...(editingTrip.addons || []), { name: '', price: 0, description: '' }] 
    });
  };

  const handleAddonChange = (index, field, value) => {
    const newAddons = [...(editingTrip.addons || [])];
    newAddons[index] = { 
      ...newAddons[index], 
      [field]: field === 'price' ? parseInt(value) || 0 : value 
    };
    setEditingTrip({ ...editingTrip, addons: newAddons });
  };

  const handleRemoveAddon = (index) => {
    const newAddons = editingTrip.addons.filter((_, i) => i !== index);
    setEditingTrip({ ...editingTrip, addons: newAddons });
  };

  // Pickup Location handlers
  const handleAddPickupLocation = () => {
    const newLocations = editingTrip.pickupLocations || [];
    newLocations.push({
      id: Date.now().toString(),
      location: '',
      date: '',
      time: '',
      address: ''
    });
    setEditingTrip({ ...editingTrip, pickupLocations: newLocations });
  };

  const handlePickupLocationChange = (index, field, value) => {
    const newLocations = [...(editingTrip.pickupLocations || [])];
    newLocations[index] = { ...newLocations[index], [field]: value };
    setEditingTrip({ ...editingTrip, pickupLocations: newLocations });
  };

  const handleRemovePickupLocation = (index) => {
    const newLocations = (editingTrip.pickupLocations || []).filter((_, i) => i !== index);
    setEditingTrip({ ...editingTrip, pickupLocations: newLocations });
  };

  // Available Departure Dates / Batches handlers
  const handleAddAvailableDate = (dateStr) => {
    if (!dateStr) return;
    setEditingTrip(prev => {
      const current = prev?.availableDates || [];
      if (current.includes(dateStr)) return prev;
      const updated = [...current, dateStr].sort();
      return { ...prev, availableDates: updated };
    });
  };

  const handleRemoveAvailableDate = (index) => {
    setEditingTrip(prev => {
      const updated = (prev?.availableDates || []).filter((_, i) => i !== index);
      return { ...prev, availableDates: updated };
    });
  };

  const handleGenerateRecurringDates = (daysOfWeek = [5], count = 4) => {
    const result = [];
    const today = new Date();
    
    // Filter and keep only the day of the week that comes first in chronological week order (Monday to Sunday)
    let actualDays = [...daysOfWeek];
    if (actualDays.length > 0) {
      const order = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
      actualDays.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      actualDays = [actualDays[0]]; // Only keep the first day (departure day)
    }
    
    actualDays.forEach(dayOfWeek => {
      let d = new Date(today);
      // Start checking from tomorrow to ensure we find the very next occurrence (not today)
      d.setDate(d.getDate() + 1);
      while (d.getDay() !== dayOfWeek) {
        d.setDate(d.getDate() + 1);
      }
      for (let i = 0; i < count; i++) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        result.push(`${year}-${month}-${day}`);
        d.setDate(d.getDate() + 7);
      }
    });

    setEditingTrip(prev => {
      // Overwrite existing availableDates and clear any pickupLocations containing date fields
      const cleanPickups = (prev?.pickupLocations || []).filter(p => !p.date);
      return { 
        ...prev, 
        availableDates: result.sort(),
        pickupLocations: cleanPickups
      };
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const difficultyColors = { 
    Easy: 'bg-green-50 text-green-700 border border-green-200', 
    Moderate: 'bg-yellow-50 text-yellow-700 border border-yellow-200', 
    Difficult: 'bg-red-50 text-red-700 border border-red-200', 
    Expert: 'bg-purple-50 text-purple-700 border border-purple-200' 
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
          <h1 className="text-2xl font-bold text-gray-900">Manage Trips</h1>
          <p className="text-gray-500 text-sm mt-0.5">{trips.length} trips total</p>
        </div>
        <button onClick={handleAddNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add New Trip
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle size={20} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-700 hover:text-red-900"><X size={18} /></button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search trips..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b border-gray-200 bg-gray-50/50">
                  <th className="p-6 font-semibold">Trip</th>
                  <th className="p-6 font-semibold">Category</th>
                  <th className="p-6 font-semibold">Duration</th>
                  <th className="p-6 font-semibold">Price</th>
                  <th className="p-6 font-semibold">Difficulty</th>
                  <th className="p-6 font-semibold">Status</th>
                  <th className="p-6 font-semibold">Featured</th>
                  <th className="p-6 font-semibold">Upcoming</th>
                  <th className="p-6 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map((trip) => (
                  <tr key={trip.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <img src={trip.images?.[0]} alt={trip.title} className="w-20 h-14 rounded-lg object-cover bg-gray-100" />
                        <div>
                          <div className="text-gray-900 font-semibold">{trip.title}</div>
                          <div className="text-gray-500 text-sm">{trip.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-primary-50 text-primary-700 border border-primary-200 rounded-full text-xs font-semibold">{trip.categoryName}</span>
                    </td>
                    <td className="p-6 text-gray-700">{trip.nights || 0}N/{trip.days || (trip.nights || 0) + 1}D</td>
                    <td className="p-6 text-gray-900 font-bold">₹{trip.price?.toLocaleString()}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[trip.difficulty]}`}>{trip.difficulty}</span>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${trip.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                        {trip.status?.charAt(0).toUpperCase() + trip.status?.slice(1)}
                      </span>
                    </td>
                    <td className="p-6">
                      {trip.featured ? (
                        <span className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-semibold">⭐ Featured</span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-6">
                      {trip.upcoming ? (
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">📅 Upcoming</span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleShareWhatsApp(trip)} 
                          className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 hover:bg-green-100 border border-green-100 transition-colors"
                          title="Share Package Link on WhatsApp"
                        >
                          <Send size={16} />
                        </button>
                        <button onClick={() => handleEdit(trip)} className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 hover:bg-primary-100 border border-primary-100 transition-colors">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(trip.id)} className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-100 border border-red-100 transition-colors">
                          <Trash2 size={18} />
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

      {showModal && editingTrip && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden my-4 flex flex-col shadow-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTrip.id ? 'Edit Trip' : 'Add New Trip'}
              </h2>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4 bg-gray-50/50">
              {/* Basic Information Section */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <button type="button" onClick={() => toggleSection('basic')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">1</span>
                    Basic Information
                  </span>
                  {expandedSections.includes('basic') ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedSections.includes('basic') && (
                  <div className="p-6 pt-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 font-semibold text-sm mb-2">Trip Title *</label>
                        <input 
                          type="text" 
                          value={editingTrip.title} 
                          onChange={(e) => handleFieldChange('title', e.target.value)}
                          placeholder="Enter trip title..."
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-gray-700 font-semibold text-sm mb-2">Description</label>
                        <textarea 
                          value={editingTrip.description || ''} 
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                          rows={3}
                          placeholder="Enter description..."
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-semibold text-sm mb-2">Location *</label>
                        <input 
                          type="text" 
                          value={editingTrip.location || ''} 
                          onChange={(e) => handleFieldChange('location', e.target.value)}
                          placeholder="e.g., Manali, HP"
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-semibold text-sm mb-2">Trip Category *</label>
                        <select 
                          value={editingTrip.categoryId} 
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.title || cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold text-sm mb-2">Price (₹) *</label>
                        <input 
                          type="number" 
                          value={editingTrip.price || 0} 
                          onChange={(e) => handleFieldChange('price', parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold text-sm mb-2">Rating (0-5)</label>
                        <input 
                          type="number" 
                          value={editingTrip.rating || 0} 
                          onChange={(e) => handleFieldChange('rating', parseFloat(e.target.value) || 0)}
                          step="0.1" 
                          min="0" 
                          max="5"
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold text-sm mb-2">Duration (Nights)</label>
                        <input 
                          type="number" 
                          value={editingTrip.nights || 0} 
                          onChange={(e) => handleFieldChange('nights', parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold text-sm mb-2">Duration (Days)</label>
                        <input 
                          type="number" 
                          value={editingTrip.days || (editingTrip.nights || 0) + 1} 
                          onChange={(e) => handleFieldChange('days', parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold text-sm mb-2">Difficulty *</label>
                        <select 
                          value={editingTrip.difficulty || 'Moderate'} 
                          onChange={(e) => handleFieldChange('difficulty', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Difficult">Difficult</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold text-sm mb-2">Max Group Size</label>
                        <input 
                          type="number" 
                          value={editingTrip.maxGroupSize || 15} 
                          onChange={(e) => handleFieldChange('maxGroupSize', parseInt(e.target.value) || 15)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-semibold text-sm mb-2">Status</label>
                        <select 
                          value={editingTrip.status || 'active'} 
                          onChange={(e) => handleFieldChange('status', e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center gap-3 cursor-pointer mt-3">
                          <input 
                            type="checkbox" 
                            checked={editingTrip.featured || false}
                            onChange={(e) => handleFieldChange('featured', e.target.checked)}
                            className="w-5 h-5 bg-white border-gray-300 rounded text-primary-500 focus:ring-primary-500" 
                          />
                          <span className="text-gray-700 font-medium">Featured Trip</span>
                        </label>
                      </div>

                      <div>
                        <label className="flex items-center gap-3 cursor-pointer mt-3">
                          <input 
                            type="checkbox" 
                            checked={editingTrip.upcoming || false}
                            onChange={(e) => handleFieldChange('upcoming', e.target.checked)}
                            className="w-5 h-5 bg-white border-gray-300 rounded text-primary-500 focus:ring-primary-500" 
                          />
                          <span className="text-gray-700 font-medium">Upcoming Trip</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Images Section */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <button type="button" onClick={() => toggleSection('images')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">2</span>
                    Trip Images ({editingTrip.images?.length || 0})
                  </span>
                  {expandedSections.includes('images') ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedSections.includes('images') && (
                  <div className="p-6 pt-2 space-y-4">
                    <p className="text-gray-500 text-sm">Upload images (auto-compressed to 100-200KB)</p>
                    
                    {editingTrip.images?.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {editingTrip.images.map((url, index) => (
                          <div key={index} className="relative group">
                            <img src={url} alt={`Image ${index + 1}`} className="w-full h-32 object-cover rounded-xl bg-gray-100 border border-gray-200" />
                            <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <label className="flex items-center justify-center gap-3 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400" />
                          <span className="text-gray-500 font-medium">Click to upload image</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Highlights Section */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <button type="button" onClick={() => toggleSection('highlights')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">3</span>
                    Trip Highlights ({typeof editingTrip.highlights === 'string' ? editingTrip.highlights.split(',').map(h => h.trim()).filter(Boolean).length : (editingTrip.highlights || []).length})
                  </span>
                  {expandedSections.includes('highlights') ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedSections.includes('highlights') && (
                  <div className="p-6 pt-2 space-y-4">
                    <div className="flex gap-3 items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-3" />
                      <textarea 
                        value={editingTrip.highlights || ''} 
                        onChange={(e) => handleFieldChange('highlights', e.target.value)}
                        placeholder="Enter highlights separated by commas (e.g. Kalu Waterfall Trek, Scenic views, Expert guides)..."
                        className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" 
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Inclusions Section */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <button type="button" onClick={() => toggleSection('inclusions')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">4</span>
                    Inclusions & Exclusions
                  </span>
                  {expandedSections.includes('inclusions') ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedSections.includes('inclusions') && (
                  <div className="p-6 pt-2 space-y-6">
                    <div>
                      <h4 className="text-green-700 font-bold mb-3 flex items-center gap-2">
                        <span>✓ What's Included</span>
                        <span className="text-xs font-normal text-gray-400">
                          ({typeof editingTrip.inclusions === 'string' ? editingTrip.inclusions.split(',').map(i => i.trim()).filter(Boolean).length : (editingTrip.inclusions || []).length})
                        </span>
                      </h4>
                      <div className="flex gap-3 items-start">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-3" />
                        <textarea 
                          value={editingTrip.inclusions || ''} 
                          onChange={(e) => handleFieldChange('inclusions', e.target.value)}
                          placeholder="Enter inclusions separated by commas (e.g. Accommodation, Meals, Guide, Permits)..."
                          className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" 
                          rows={3}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-red-700 font-bold mb-3 flex items-center gap-2">
                        <span>✗ Excluded</span>
                        <span className="text-xs font-normal text-gray-400">
                          ({typeof editingTrip.exclusions === 'string' ? editingTrip.exclusions.split(',').map(e => e.trim()).filter(Boolean).length : (editingTrip.exclusions || []).length})
                        </span>
                      </h4>
                      <div className="flex gap-3 items-start">
                        <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-3" />
                        <textarea 
                          value={editingTrip.exclusions || ''} 
                          onChange={(e) => handleFieldChange('exclusions', e.target.value)}
                          placeholder="Enter exclusions separated by commas (e.g. Travel insurance, Personal expenses, Mineral water)..."
                          className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" 
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Itinerary Section */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <button type="button" onClick={() => toggleSection('itinerary')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">5</span>
                    Day-wise Itinerary ({(editingTrip.itinerary || []).length})
                  </span>
                  {expandedSections.includes('itinerary') ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedSections.includes('itinerary') && (
                  <div className="p-6 pt-2 space-y-4">
                    {(editingTrip.itinerary || []).map((day, index) => (
                      <div key={index} className="bg-white rounded-xl p-4 space-y-3 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold">D{day.day}</span>
                            </div>
                            <input 
                              type="number" 
                              value={day.day} 
                              onChange={(e) => handleItineraryChange(index, 'day', e.target.value)} 
                              min="1"
                              className="w-20 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button" 
                              disabled={index === 0} 
                              onClick={() => handleMoveItinerary(index, 'up')} 
                              className="w-10 h-10 bg-gray-100 text-gray-650 hover:bg-gray-250 border border-gray-200 transition-colors rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Move Day Up"
                            >
                              <ChevronUp size={18} />
                            </button>
                            <button 
                              type="button" 
                              disabled={index === (editingTrip.itinerary || []).length - 1} 
                              onClick={() => handleMoveItinerary(index, 'down')} 
                              className="w-10 h-10 bg-gray-100 text-gray-655 hover:bg-gray-250 border border-gray-200 transition-colors rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Move Day Down"
                            >
                              <ChevronDown size={18} />
                            </button>
                            <button type="button" onClick={() => handleRemoveItinerary(index)} className="w-10 h-10 bg-red-50 text-red-650 hover:bg-red-100 border border-red-200 text-red-650 transition-colors rounded-lg flex items-center justify-center">
                              <Trash size={18} className="text-red-600" />
                            </button>
                          </div>
                        </div>
                        <input 
                          type="text" 
                          value={day.title} 
                          onChange={(e) => handleItineraryChange(index, 'title', e.target.value)} 
                          placeholder="Day title..."
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                        />
                        <textarea 
                          value={day.description} 
                          onChange={(e) => handleItineraryChange(index, 'description', e.target.value)} 
                          rows={2} 
                          placeholder="Day description..."
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" 
                        />
                      </div>
                    ))}
                    <button type="button" onClick={handleAddItinerary} className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-primary-600 hover:border-primary-500 transition-colors flex items-center justify-center gap-2 bg-white">
                      <PlusCircle size={18} /> Add Day
                    </button>
                  </div>
                )}
              </div>

              {/* Departure Dates / Batches Section */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <button type="button" onClick={() => toggleSection('availableDates')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">6</span>
                    Departure Dates / Batches ({(editingTrip.availableDates || []).length + (editingTrip.pickupLocations || []).filter(p => p.date).length})
                  </span>
                  {expandedSections.includes('availableDates') ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedSections.includes('availableDates') && (
                  <div className="p-6 pt-2 space-y-5">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5">Multiple Departure Dates</span>
                        Add multiple batch dates for this trek without duplicating the trip. You can pick dates individually or use the generator below!
                      </div>
                    </div>

                    {/* Interactive Custom Batch Generator */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-900 font-bold text-xs flex items-center gap-1.5">
                          🛠️ Custom Recurring Batch Generator
                        </span>
                        <span className="text-[11px] text-primary-600 font-semibold">Pick Any Days & Duration</span>
                      </div>

                      {/* Day Selection Checkboxes */}
                      <div>
                        <span className="block text-gray-700 text-[11px] font-semibold mb-1.5">1. Select Days of the Week:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'Mon', val: 1 },
                            { label: 'Tue', val: 2 },
                            { label: 'Wed', val: 3 },
                            { label: 'Thu', val: 4 },
                            { label: 'Fri', val: 5 },
                            { label: 'Sat', val: 6 },
                            { label: 'Sun', val: 0 },
                          ].map(d => {
                            const isSelected = selectedDays.includes(d.val);
                            return (
                              <button
                                key={d.val}
                                type="button"
                                onClick={() => {
                                  setSelectedDays(prev =>
                                    isSelected ? prev.filter(v => v !== d.val) : [...prev, d.val]
                                  );
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  isSelected
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-2xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                  }`}
                              >
                                {isSelected ? `✓ ${d.label}` : d.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Duration Dropdown & Generate Button */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 pt-1">
                        <div className="flex-1">
                          <span className="block text-gray-700 text-[11px] font-semibold mb-1">2. Select Duration / Weeks:</span>
                          <select
                            value={recurrenceWeeks}
                            onChange={(e) => setRecurrenceWeeks(parseInt(e.target.value) || 4)}
                            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          >
                            <option value={4}>4 Weeks (1 Month)</option>
                            <option value={8}>8 Weeks (2 Months)</option>
                            <option value={12}>12 Weeks (3 Months)</option>
                            <option value={24}>24 Weeks (6 Months)</option>
                            <option value={52}>52 Weeks (1 Year)</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          disabled={selectedDays.length === 0}
                          onClick={() => handleGenerateRecurringDates(selectedDays, recurrenceWeeks)}
                          className="px-5 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 h-[38px]"
                        >
                          ⚡ Generate Batches
                        </button>
                      </div>
                    </div>

                    {/* Add Custom Date Input */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                      <span className="text-gray-900 font-bold text-xs block border-b border-gray-200 pb-2">
                        ➕ Add Custom / Specific Date
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-gray-700 text-[11px] font-semibold mb-1">Select Date *</label>
                          <input
                            type="date"
                            value={newDateInput}
                            onChange={(e) => setNewDateInput(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-[11px] font-semibold mb-1">Time (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g., 10:00 PM"
                            value={newTimeInput}
                            onChange={(e) => setNewTimeInput(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-[11px] font-semibold mb-1">Pickup Location (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g., Wakad, Pune"
                            value={newLocationInput}
                            onChange={(e) => setNewLocationInput(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (newDateInput) {
                              if (newTimeInput || newLocationInput) {
                                // Add to pickupLocations
                                const newPickup = {
                                  id: Date.now().toString(),
                                  date: newDateInput,
                                  time: newTimeInput || '',
                                  location: newLocationInput || 'Departure Point',
                                  address: ''
                                };
                                setEditingTrip(prev => ({
                                  ...prev,
                                  pickupLocations: [...(prev.pickupLocations || []), newPickup]
                                }));
                              } else {
                                // Add to availableDates
                                handleAddAvailableDate(newDateInput);
                              }
                              setNewDateInput('');
                              setNewTimeInput('');
                              setNewLocationInput('');
                            }
                          }}
                          disabled={!newDateInput}
                          className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 h-[34px]"
                        >
                          <PlusCircle size={14} /> Add Date
                        </button>
                      </div>
                    </div>

                    {/* List of Configured Dates */}
                    <div>
                      {(() => {
                        const allConfiguredDates = [
                          ...(editingTrip.availableDates || []).map((d) => ({
                            date: d,
                            display: d,
                            type: 'simple',
                            time: isSaturday(d) ? '10:00 PM' : '6:00 AM',
                            location: 'Default'
                          })),
                          ...(editingTrip.pickupLocations || []).filter(p => p.date).map((p) => ({
                            date: p.date,
                            display: p.date,
                            type: 'custom',
                            id: p.id,
                            time: p.time || (isSaturday(p.date) ? '10:00 PM' : '6:00 AM'),
                            location: p.location || 'Departure Point'
                          }))
                        ].sort((a, b) => new Date(a.date) - new Date(b.date));

                        const totalCount = allConfiguredDates.length;

                        return (
                          <>
                            <label className="block text-gray-700 font-semibold text-xs mb-2">
                              Configured Departure Dates ({totalCount})
                            </label>
                            {totalCount === 0 ? (
                              <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400 text-xs font-medium">
                                No departure dates added yet. Pick a date above or use the generator!
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                                {allConfiguredDates.map((item, index) => {
                                  const dateObj = new Date(item.date);
                                  const formatted = !isNaN(dateObj.getTime())
                                    ? dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                                    : item.date;
                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all group"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-primary-600 shadow-2xs flex-shrink-0 font-bold text-xs">
                                          {!isNaN(dateObj.getTime()) ? dateObj.getDate() : '📅'}
                                        </div>
                                        <div className="truncate">
                                          <span className="text-sm font-bold text-gray-800 block leading-tight truncate">{formatted}</span>
                                          <span className="text-[10px] text-gray-500 font-medium block leading-none mt-0.5 truncate">{item.time} | {item.location}</span>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (item.type === 'simple') {
                                            setEditingTrip(prev => ({
                                              ...prev,
                                              availableDates: (prev.availableDates || []).filter(d => d !== item.date)
                                            }));
                                          } else {
                                            setEditingTrip(prev => ({
                                              ...prev,
                                              pickupLocations: (prev.pickupLocations || []).filter(p => p.id !== item.id)
                                            }));
                                          }
                                        }}
                                        className="w-7 h-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ml-1"
                                        title="Remove date"
                                      >
                                        <Trash size={14} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Pickup Information Section */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <button type="button" onClick={() => toggleSection('pickup')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">7</span>
                    Pickup Locations ({(editingTrip.pickupLocations || []).length})
                  </span>
                  {expandedSections.includes('pickup') ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedSections.includes('pickup') && (
                  <div className="p-6 pt-2 space-y-4">
                    <p className="text-gray-500 text-sm">Add multiple pickup locations for this trip</p>
                    
                    {(editingTrip.pickupLocations || []).map((loc, index) => (
                      <div key={loc.id || index} className="bg-white rounded-xl p-4 space-y-3 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-primary-600 text-sm font-semibold">Location {index + 1}</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemovePickupLocation(index)} 
                            className="w-8 h-8 bg-red-50 text-red-650 hover:bg-red-100 border border-red-200 text-red-650 transition-colors rounded-lg flex items-center justify-center"
                          >
                            <Trash size={16} className="text-red-600" />
                          </button>
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 font-semibold text-xs mb-1.5">Location Name *</label>
                          <input 
                            type="text" 
                            value={loc.location || ''} 
                            onChange={(e) => handlePickupLocationChange(index, 'location', e.target.value)}
                            placeholder="e.g., Manali Bus Stand, ISBT Delhi"
                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 font-semibold text-xs mb-1.5">Full Address</label>
                          <input 
                            type="text" 
                            value={loc.address || ''} 
                            onChange={(e) => handlePickupLocationChange(index, 'address', e.target.value)}
                            placeholder="e.g., Near Main Market, Mall Road"
                            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" 
                          />
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      type="button" 
                      onClick={handleAddPickupLocation} 
                      className="w-full py-3 border border-dashed border-primary-300 rounded-xl text-primary-600 hover:bg-primary-50 hover:border-primary-500 transition-colors flex items-center justify-center gap-2 bg-white font-semibold"
                    >
                      <PlusCircle size={18} /> Add Pickup Location
                    </button>
                  </div>
                )}
              </div>

              {/* Things to Carry Section */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <button type="button" onClick={() => toggleSection('thingsToCarry')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">8</span>
                    Things to Carry ({typeof editingTrip.thingsToCarry === 'string' ? editingTrip.thingsToCarry.split(',').map(t => t.trim()).filter(Boolean).length : (editingTrip.thingsToCarry || []).length})
                  </span>
                  {expandedSections.includes('thingsToCarry') ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedSections.includes('thingsToCarry') && (
                  <div className="p-6 pt-2 space-y-4">
                    <p className="text-gray-500 text-sm">Add items that trekkers should carry for this trip (separated by commas)</p>
                    <div className="flex gap-3 items-start">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-3" />
                      <textarea 
                        value={editingTrip.thingsToCarry || ''} 
                        onChange={(e) => handleFieldChange('thingsToCarry', e.target.value)}
                        placeholder="Enter items separated by commas (e.g. Trekking shoes, Water bottle, Raincoat, Torch)..."
                        className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" 
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cancellation Policy Section */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <button type="button" onClick={() => toggleSection('cancellationPolicy')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">9</span>
                    Cancellation Policy ({typeof editingTrip.cancellationPolicy === 'string' ? editingTrip.cancellationPolicy.split(',').map(c => c.trim()).filter(Boolean).length : (editingTrip.cancellationPolicy || []).length})
                  </span>
                  {expandedSections.includes('cancellationPolicy') ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedSections.includes('cancellationPolicy') && (
                  <div className="p-6 pt-2 space-y-4">
                    <p className="text-gray-500 text-sm">Add cancellation policy rules for this trip (separated by commas)</p>
                    <div className="flex gap-3 items-start">
                      <X className="w-5 h-5 text-orange-600 flex-shrink-0 mt-3" />
                      <textarea 
                        value={editingTrip.cancellationPolicy || ''} 
                        onChange={(e) => handleFieldChange('cancellationPolicy', e.target.value)}
                        placeholder="Enter cancellation rules separated by commas (e.g. Free cancellation up to 7 days before, No refund within 24 hours)..."
                        className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" 
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Trip Rules Section */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <button type="button" onClick={() => toggleSection('rules')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">10</span>
                    Trip Rules ({typeof editingTrip.rules === 'string' ? editingTrip.rules.split(',').map(r => r.trim()).filter(Boolean).length : (editingTrip.rules || []).length})
                  </span>
                  {expandedSections.includes('rules') ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedSections.includes('rules') && (
                  <div className="p-6 pt-2 space-y-4">
                    <p className="text-gray-500 text-sm">Add rules and guidelines for this trip (separated by commas)</p>
                    <div className="flex gap-3 items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-3" />
                      <textarea 
                        value={editingTrip.rules || ''} 
                        onChange={(e) => handleFieldChange('rules', e.target.value)}
                        placeholder="Enter trip rules separated by commas (e.g. No smoking during trek, Keep the environment clean, Follow guide instructions)..."
                        className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" 
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Hotel & Food Details Section */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <button type="button" onClick={() => toggleSection('hotelsAndFood')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">11</span>
                    Hotel & Food Details
                  </span>
                  {expandedSections.includes('hotelsAndFood') ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedSections.includes('hotelsAndFood') && (
                  <div className="p-6 pt-2 space-y-4">
                    <div>
                      <label className="block text-gray-700 font-semibold text-sm mb-2">Hotel Details</label>
                      <textarea 
                        value={editingTrip.hotelDetails || ''} 
                        onChange={(e) => handleFieldChange('hotelDetails', e.target.value)}
                        rows={3}
                        placeholder="Enter hotel lodging details (names, ratings, inclusions)..."
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold text-sm mb-2">Food Details</label>
                      <textarea 
                        value={editingTrip.foodDetails || ''} 
                        onChange={(e) => handleFieldChange('foodDetails', e.target.value)}
                        rows={3}
                        placeholder="Enter food/catering details (breakfast, lunch, dinner options)..."
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Places Covered & Important Instructions Section */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <button type="button" onClick={() => toggleSection('additionalInfo')} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-sm">12</span>
                    Places Covered & Important Instructions
                  </span>
                  {expandedSections.includes('additionalInfo') ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>
                
                {expandedSections.includes('additionalInfo') && (
                  <div className="p-6 pt-2 space-y-4">
                    <div>
                      <label className="block text-gray-700 font-semibold text-sm mb-2">Places Covered</label>
                      <textarea 
                        value={editingTrip.placesCovered || ''} 
                        onChange={(e) => handleFieldChange('placesCovered', e.target.value)}
                        rows={3}
                        placeholder="Enter places covered separated by commas (e.g. Solang Valley, Rohtang Pass, Old Manali)..."
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold text-sm mb-2">Important Instructions</label>
                      <textarea 
                        value={editingTrip.importantInstructions || ''} 
                        onChange={(e) => handleFieldChange('importantInstructions', e.target.value)}
                        rows={3}
                        placeholder="Enter important instructions separated by commas (e.g. Carry original ID proof, Avoid plastic bags, Keep cash handy)..."
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none focus:ring-1 focus:ring-primary-500" 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-400 bg-white transition-colors font-medium">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingTrip.id ? 'Save Changes' : 'Add Trip'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTrips;
