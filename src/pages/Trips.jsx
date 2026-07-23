import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, MapPin, ChevronRight, Mountain, Globe, LayoutGrid } from 'lucide-react';
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

  const setType = (t) => setSearchParams(p => { const n = new URLSearchParams(p); t === 'all' ? n.delete('type') : n.set('type', t); return n; });
  const setCategory = (c) => setSearchParams(p => { const n = new URLSearchParams(p); c === 'all' ? n.delete('category') : n.set('category', c); return n; });

  useEffect(() => {
    const unsubscribeTrips = useCachedTrips((data) => {
      setTrips(data);
      setLoading(false);
    });
    const unsubscribeCategories = useCachedCategories((data) => {
      const allCat = [{ id: 'all', title: 'All Trips' }];
      const mappedCats = data.map(cat => ({ id: cat.id, title: cat.name || cat.title }));
      setCategories([...allCat, ...mappedCats]);
    });
    return () => { unsubscribeTrips(); unsubscribeCategories(); };
  }, []);

  const filteredTrips = trips.filter(trip => {
    const matchesType = selectedType === 'all' || trip.tripType === selectedType;

    const targetCat = categories.find(c => String(c.id) === String(selectedCategory));
    const targetTitle = (targetCat?.title || targetCat?.name || '').toLowerCase();
    const tripCatId = String(trip.categoryId || '').toLowerCase();
    const tripCatName = String(trip.categoryName || '').toLowerCase();
    const selCatId = String(selectedCategory).toLowerCase();

    const matchesCategory = selectedCategory === 'all' ||
      tripCatId === selCatId ||
      tripCatName === selCatId ||
      (targetTitle && (tripCatId === targetTitle || tripCatName === targetTitle));

    const matchesSearch = searchQuery === '' ||
      trip.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesCategory && matchesSearch;
  });

  const domesticCount = trips.filter(t => t.tripType === 'domestic').length;
  const internationalCount = trips.filter(t => t.tripType === 'international').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#00C9B7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Hero Banner - Full Bleed Navbar Alignment */}
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
          {/* Type Filters */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setType('all')}
              className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-2xs"
              style={{ background: selectedType === 'all' ? '#00C9B7' : '#F3F4F6', color: selectedType === 'all' ? '#ffffff' : '#4B5563' }}
            >
              All ({trips.length})
            </button>
            <button
              onClick={() => setType('domestic')}
              className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-2xs"
              style={{ background: selectedType === 'domestic' ? '#10b981' : '#F3F4F6', color: selectedType === 'domestic' ? '#ffffff' : '#4B5563' }}
            >
              <MapPin size={11} />
              Domestic ({domesticCount})
            </button>
            <button
              onClick={() => setType('international')}
              className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shadow-2xs"
              style={{ background: selectedType === 'international' ? '#3b82f6' : '#F3F4F6', color: selectedType === 'international' ? '#ffffff' : '#4B5563' }}
            >
              <Globe size={11} />
              International ({internationalCount})
            </button>

            {/* Divider */}
            {categories.length > 1 && <div className="w-px h-5 bg-[#EEEEEE] mx-1 flex-shrink-0" />}

            {/* Category Filters */}
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                style={{ background: selectedCategory === cat.id ? '#111827' : '#F3F4F6', color: selectedCategory === cat.id ? '#00C9B7' : '#4B5563' }}
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-[#888888]">
            Showing <span className="text-[#111111] font-semibold">{filteredTrips.length}</span> adventures
          </p>
          {searchQuery && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#888888]">Search results for:</span>
              <span className="bg-[#f7f7f7] px-3 py-1 rounded-full font-medium text-[#222222] border border-[#ebebeb]">"{searchQuery}"</span>
              <button
                onClick={() => setSearchParams(p => { const n = new URLSearchParams(p); n.delete('search'); return n; })}
                className="text-red-500 hover:text-red-600 font-semibold text-xs ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>

        {filteredTrips.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-[#EEEEEE]">
            <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mountain className="w-8 h-8 text-[#9CA3AF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#111111] mb-1">No trips found</h3>
            <p className="text-[#888888] text-sm">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trips;
