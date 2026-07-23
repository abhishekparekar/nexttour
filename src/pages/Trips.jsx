import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, MapPin, ChevronRight, Mountain, Globe, LayoutGrid, RotateCcw, X } from 'lucide-react';
import TripCard from '../components/TripCard';
import { useCachedTrips, useCachedCategories } from '../firebaseCache';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedType = searchParams.get('type') || 'all';
  const selectedCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';

  const setType = (t) => setSearchParams(p => {
    const n = new URLSearchParams(p);
    t === 'all' ? n.delete('type') : n.set('type', t);
    return n;
  });

  const setCategory = (c) => setSearchParams(p => {
    const n = new URLSearchParams(p);
    c === 'all' ? n.delete('category') : n.set('category', c);
    return n;
  });

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  useEffect(() => {
    const unsubscribeTrips = useCachedTrips((data) => {
      setTrips(data || []);
      setLoading(false);
    });
    const unsubscribeCategories = useCachedCategories((data) => {
      const allCat = [{ id: 'all', title: 'All Trips' }];
      const mappedCats = (data || []).map(cat => ({ id: cat.id, title: cat.name || cat.title }));
      setCategories([...allCat, ...mappedCats]);
    });
    return () => { unsubscribeTrips(); unsubscribeCategories(); };
  }, []);

  // Filter Logic with safe fallbacks
  const filteredTrips = trips.filter(trip => {
    // Trip Type Matching (domestic / international)
    const tripTypeVal = (trip.tripType || 'domestic').toLowerCase();
    const matchesType = selectedType === 'all' || tripTypeVal === selectedType.toLowerCase();

    // Category Matching
    const targetCat = categories.find(c => String(c.id).toLowerCase() === String(selectedCategory).toLowerCase());
    const targetTitle = (targetCat?.title || targetCat?.name || '').toLowerCase();
    const tripCatId = String(trip.categoryId || '').toLowerCase();
    const tripCatName = String(trip.categoryName || trip.category || '').toLowerCase();
    const selCatId = String(selectedCategory).toLowerCase();

    const matchesCategory = selectedCategory === 'all' ||
      tripCatId === selCatId ||
      tripCatName === selCatId ||
      (targetTitle && (tripCatId === targetTitle || tripCatName.includes(targetTitle)));

    // Search Query Matching
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = q === '' ||
      trip.title?.toLowerCase().includes(q) ||
      trip.location?.toLowerCase().includes(q) ||
      trip.categoryName?.toLowerCase().includes(q) ||
      trip.description?.toLowerCase().includes(q) ||
      trip.overview?.toLowerCase().includes(q);

    return matchesType && matchesCategory && matchesSearch;
  });

  // Calculate domestic vs international count
  const domesticCount = trips.filter(t => (t.tripType || 'domestic').toLowerCase() === 'domestic').length;
  const internationalCount = trips.filter(t => (t.tripType || '').toLowerCase() === 'international').length;

  const hasActiveFilters = selectedType !== 'all' || selectedCategory !== 'all' || searchQuery !== '';

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#00C9B7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Hero Banner */}
      <div className="relative h-[38vh] sm:h-[42vh] min-h-[300px] w-full overflow-hidden shadow-md bg-[#0d1117] flex items-center justify-center pt-20 pb-8 select-none">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=2070&q=80"
          alt="Adventures"
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => { e.target.onerror = null; e.target.src = '/herobg1.png'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/50 to-black/85 pointer-events-none" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end">
          <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-3">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span className="text-white">Trips</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#00C9B7]/20 text-[#00C9B7] rounded-full text-xs font-medium mb-2 backdrop-blur-sm">
                <LayoutGrid size={10} />
                Featured
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                Explore Our <span className="text-[#00C9B7]">Adventures</span>
              </h1>
              <p className="text-white/70 text-sm mt-1">Discover handpicked experiences for every skill level</p>
            </div>
            {/* Stats */}
            <div className="flex gap-4 bg-white/15 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{trips.length}</div>
                <div className="text-xs text-white/70">Total</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-400">{domesticCount}</div>
                <div className="text-xs text-white/70">Domestic</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <div className="text-xl font-bold text-blue-400">{internationalCount}</div>
                <div className="text-xs text-white/70">International</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-16 md:top-20 z-40 bg-white/95 backdrop-blur-md border-b border-[#EEEEEE] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Type & Category Pill Filters */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setType('all')}
              className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-2xs cursor-pointer"
              style={{ background: selectedType === 'all' ? '#00C9B7' : '#F3F4F6', color: selectedType === 'all' ? '#ffffff' : '#4B5563' }}
            >
              All ({trips.length})
            </button>
            <button
              onClick={() => setType('domestic')}
              className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              style={{ background: selectedType === 'domestic' ? '#10b981' : '#F3F4F6', color: selectedType === 'domestic' ? '#ffffff' : '#4B5563' }}
            >
              <MapPin size={11} />
              Domestic ({domesticCount})
            </button>
            <button
              onClick={() => setType('international')}
              className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              style={{ background: selectedType === 'international' ? '#3b82f6' : '#F3F4F6', color: selectedType === 'international' ? '#ffffff' : '#4B5563' }}
            >
              <Globe size={11} />
              International ({internationalCount})
            </button>

            {/* Divider */}
            {categories.length > 1 && <div className="w-px h-5 bg-[#EEEEEE] mx-1 flex-shrink-0" />}

            {/* Category Filters */}
            {categories.map((cat) => {
              const isSelected = String(selectedCategory).toLowerCase() === String(cat.id).toLowerCase();
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
                  style={{ background: isSelected ? '#111827' : '#F3F4F6', color: isSelected ? '#00C9B7' : '#4B5563' }}
                >
                  {cat.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-[#888888]">
            Showing <span className="text-[#111111] font-semibold">{filteredTrips.length}</span> adventures
          </p>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium">Active Filters:</span>
              {selectedType !== 'all' && (
                <span className="bg-[#00C9B7]/10 text-[#00C9B7] px-2.5 py-1 rounded-full font-bold border border-[#00C9B7]/20 flex items-center gap-1">
                  Type: {selectedType}
                  <button onClick={() => setType('all')} className="hover:text-red-600"><X size={12} /></button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full font-bold border border-gray-200 flex items-center gap-1">
                  Category: {selectedCategory}
                  <button onClick={() => setCategory('all')} className="hover:text-red-600"><X size={12} /></button>
                </span>
              )}
              {searchQuery && (
                <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full font-bold border border-gray-200 flex items-center gap-1">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchParams(p => { const n = new URLSearchParams(p); n.delete('search'); return n; })} className="hover:text-red-600"><X size={12} /></button>
                </span>
              )}

              <button
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700 font-bold text-xs flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-full border border-red-100 transition-colors"
              >
                <RotateCcw size={11} /> Reset All
              </button>
            </div>
          )}
        </div>

        {/* Trips Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>

        {/* Empty State when 0 trips match current filter */}
        {filteredTrips.length === 0 && (
          <div className="text-center py-14 bg-white rounded-3xl border border-[#EEEEEE] p-6 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 bg-[#00C9B7]/10 text-[#00C9B7] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mountain className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#111111] mb-1">No trips match your filter</h3>
            <p className="text-gray-500 text-xs mb-5">
              {selectedType === 'international' && internationalCount === 0
                ? 'All registered trips are currently Domestic. Switch to Domestic or All Trips to view all 4 adventure packages.'
                : 'Try clearing your search query or selecting a different trip category.'}
            </p>
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
            >
              <RotateCcw size={14} /> Show All Adventures ({trips.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trips;
