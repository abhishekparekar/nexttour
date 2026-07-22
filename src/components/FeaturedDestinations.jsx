import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useCachedTrips } from '../firebaseCache';
import TripCard from './TripCard';

const FeaturedDestinations = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = useCachedTrips((data) => {
      const featured = data.filter(t => t.featured).slice(0, 6);
      setTrips(featured);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <section className="section-padding" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(0, 201, 183,0.09) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.06) 0%, transparent 50%), linear-gradient(180deg, #FAFAFA 0%, #F4F4F8 100%)' }}>
        <div className="container-custom flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-[#00C9B7] animate-spin" />
        </div>
      </section>
    );
  }

  if (trips.length === 0) return null;

  return (
    <section className="section-padding relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(0, 201, 183,0.09) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.06) 0%, transparent 50%), linear-gradient(180deg, #FAFAFA 0%, #F4F4F8 100%)' }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="container-custom relative">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-[#00C9B7]/10 text-[#00C9B7] rounded-full text-sm font-medium mb-4">Featured Destinations</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#111111] mb-6">Discover Your Next<span className="block text-gradient">Adventure</span></h2>
          <p className="text-[#555555] max-w-2xl mx-auto text-lg">Handpicked destinations that promise unforgettable experiences. Each journey crafted for the ultimate explorer.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {trips.map((trip) => (<TripCard key={trip.id} trip={trip} />))}
        </div>

        <div className="text-center mt-12">
          <Link to="/trips" className="btn-primary inline-flex items-center gap-2">View All Destinations <ArrowRight size={18} /></Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDestinations;