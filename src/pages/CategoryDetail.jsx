import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowRight, Mountain, ChevronRight } from 'lucide-react';
import TripCard from '../components/TripCard';
import { useCachedTrips, useCachedCategories } from '../firebaseCache';

const CategoryDetail = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    const unsubscribeCat = useCachedCategories((categories) => {
      const found = categories.find(c => c.id === id);
      if (found) setCategory(found);
    });
    const unsubscribeTrips = useCachedTrips((allTrips) => {
      setTrips(allTrips.filter(trip => trip.categoryId === id));
      setLoading(false);
    });
    return () => { unsubscribeCat(); unsubscribeTrips(); };
  }, [id]);

  const filteredTrips = trips.sort((a, b) => {
      if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#00C9B7] animate-spin" />
      </div>
    );
  }

  const categoryTitle = category?.title || category?.name || 'Category';
  const headerImage = category?.image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=2070&q=80';

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Hero Banner */}
      <div className="relative h-[55vh] min-h-[360px] overflow-hidden">
        <img src={headerImage} alt={categoryTitle} className="w-full h-full object-cover"  loading="lazy"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
        <div className="absolute inset-0 flex items-end">
          <div className="container-custom w-full px-4 pb-8">
            <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-4">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight size={12} />
              <Link to="/trips" className="hover:text-white transition-colors">Trips</Link>
              <ChevronRight size={12} />
              <span className="text-white">{categoryTitle}</span>
            </nav>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 bg-[#00C9B7]/20 text-[#00C9B7] rounded-full text-xs font-medium mb-3 backdrop-blur-sm">
                  Featured Category
                </span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">{categoryTitle}</h1>
                <p className="text-white/70 text-sm max-w-xl">
                  {category?.description || `Explore our collection of ${categoryTitle.toLowerCase()} trips.`}
                </p>
              </div>
              <div className="flex gap-5 bg-white/15 backdrop-blur-md rounded-xl px-5 py-3 border border-white/20 flex-shrink-0">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{filteredTrips.length}</div>
                  <div className="text-xs text-white/70">Trips</div>
                </div>
                <div className="w-px bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{filteredTrips.filter(t => t.featured).length}</div>
                  <div className="text-xs text-white/70">Featured</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8 px-4">
        <p className="text-sm text-[#888888] mb-6">
          Showing <span className="text-[#111111] font-semibold">{filteredTrips.length}</span> trips in{' '}
          <span className="text-[#00C9B7]">{categoryTitle}</span>
        </p>

        {filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#EEEEEE]">
            <div className="w-20 h-20 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-5">
              <Mountain className="w-10 h-10 text-[#9CA3AF]" />
            </div>
            <h3 className="text-xl font-semibold text-[#111111] mb-2">No trips found</h3>
            <p className="text-[#555555] mb-6 text-sm">
              No trips available in this category yet.
            </p>
            <Link to="/trips" className="inline-flex items-center gap-2 bg-[#00C9B7] text-[#111111] font-semibold px-6 py-2.5 rounded-full hover:bg-[#00B5A5] transition-colors">
              Browse All Trips <ArrowRight size={16} />
            </Link>
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/trips" className="inline-flex items-center gap-2 text-[#888888] hover:text-[#00C9B7] transition-colors text-sm">
            ← Back to All Trips
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetail;
