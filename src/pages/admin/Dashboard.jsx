import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mountain, Calendar, Users, Star, TrendingUp, DollarSign, Activity, Loader2, Wallet, MapPin, Clock, Package } from 'lucide-react';
import { 
  subscribeToTrips, subscribeToBookings, subscribeToTestimonials, 
  subscribeToSchedules, subscribeToExpenses 
} from '../../firebase';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col gap-2.5">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} flex-shrink-0`}>
      <Icon className="w-4.5 h-4.5 text-white" style={{width:'18px',height:'18px'}} />
    </div>
    <div>
      <div className="text-xl font-black text-gray-900 leading-tight">{value}</div>
      <div className="text-gray-600 text-xs font-semibold uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubTrips = subscribeToTrips((data) => setTrips(data));
    const unsubBookings = subscribeToBookings((data) => setBookings(data));
    const unsubTestimonials = subscribeToTestimonials((data) => setTestimonials(data));
    const unsubSchedules = subscribeToSchedules((data) => setSchedules(data));
    const unsubExpenses = subscribeToExpenses((data) => {
      setExpenses(data);
      setLoading(false);
    });
    
    return () => {
      unsubTrips();
      unsubBookings();
      unsubTestimonials();
      unsubSchedules();
      unsubExpenses();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const activeTrips = trips.filter(t => t.status === 'active').length;
  const totalBookings = bookings.length;
  const upcomingTrips = schedules.filter(s => {
    const today = new Date().toISOString().split('T')[0];
    return s.departureDate >= today && s.status === 'upcoming';
  }).length;

  const totalCollection = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const pendingPayments = bookings.reduce((sum, b) => sum + ((b.amount || 0) - (b.paidAmount || 0)), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalProfit = totalCollection - totalExpenses;

  const upcomingTripSummary = schedules
    .filter(s => {
      const today = new Date().toISOString().split('T')[0];
      return s.departureDate >= today && s.status !== 'cancelled';
    })
    .sort((a, b) => a.departureDate.localeCompare(b.departureDate))
    .slice(0, 5)
    .map(s => {
      const scheduleBookings = bookings.filter(b => 
        b.scheduleId === s.id || 
        (b.tripId === s.tripId && b.selectedDate === s.departureDate)
      );
      const bookedPersons = scheduleBookings.reduce((sum, b) => sum + (Number(b.travelers) || 0), 0);
      return {
        ...s,
        bookedPersons
      };
    });

  return (
    <div>
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-base font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-xs mt-0.5">Welcome to NextTour Admin Panel</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Grid - 2 cols mobile, 3 cols sm, 6 cols lg */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard 
            icon={Calendar} 
            label="Total Bookings" 
            value={totalBookings} 
            color="bg-gradient-to-br from-primary-500 to-primary-600"
          />
          <StatCard 
            icon={Mountain} 
            label="Upcoming Trips" 
            value={upcomingTrips} 
            color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          />
          <StatCard 
            icon={DollarSign} 
            label="Total Collection" 
            value={`₹${totalCollection.toLocaleString()}`} 
            color="bg-gradient-to-br from-green-500 to-emerald-500"
          />
          <StatCard 
            icon={Wallet} 
            label="Pending Payments" 
            value={`₹${pendingPayments.toLocaleString()}`} 
            color="bg-gradient-to-br from-red-500 to-rose-500"
          />
          <StatCard icon={TrendingUp} label="Trip Expenses" value={`₹${totalExpenses.toLocaleString()}`} color="bg-gradient-to-br from-orange-500 to-orange-600" />
          <StatCard icon={Activity} label="Total Net Profit" value={`₹${totalProfit.toLocaleString()}`} color="bg-gradient-to-br from-blue-500 to-cyan-500" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Recent Bookings */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800">Recent Bookings</h3>
              <Link to="/admin/bookings" className="text-[#00C9B7] text-xs hover:underline font-semibold">View All</Link>
            </div>
            <div className="space-y-2">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-gray-800 font-semibold text-xs">{booking.name || 'Guest'}</div>
                    <div className="text-gray-600 text-xs mt-0.5 truncate max-w-[120px]">{booking.tripName || booking.tripId}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'pending' ? 'bg-[#E6FAF8] text-[#00A192]' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
              {bookings.length === 0 && (
                <p className="text-gray-400 text-center py-4 text-xs">No bookings yet</p>
              )}
            </div>
          </div>

          {/* Active Trips */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Active Trips</h3>
              <Link to="/admin/trips" className="text-[#00C9B7] text-xs hover:underline font-semibold">Manage</Link>
            </div>
            <div className="space-y-2">
              {trips.filter(t => t.status === 'active').slice(0, 5).map((trip) => (
                <div key={trip.id} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                  <img src={trip.images?.[0]} alt={trip.title} className="w-10 h-8 rounded-md object-cover bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800 font-semibold text-xs truncate">{trip.title}</div>
                    <div className="text-gray-600 text-xs">₹{trip.price?.toLocaleString()}</div>
                  </div>
                  {trip.featured && <Star className="w-3.5 h-3.5 text-[#00C9B7] fill-[#00C9B7] flex-shrink-0" />}
                </div>
              ))}
              {activeTrips === 0 && (
                <p className="text-gray-400 text-center py-4 text-xs">No active trips</p>
              )}
            </div>
          </div>

          {/* Recent Testimonials */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Recent Reviews</h3>
              <Link to="/admin/testimonials" className="text-[#00C9B7] text-xs hover:underline font-semibold">Manage</Link>
            </div>
            <div className="space-y-2">
              {testimonials.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover bg-gray-100 flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#E6FAF8] flex items-center justify-center text-[#00C9B7] font-bold text-xs flex-shrink-0">
                      {t.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-800 font-semibold text-xs">{t.name}</div>
                    <div className="text-gray-600 text-xs line-clamp-1">{t.text}</div>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {[...Array(Math.min(t.rating || 5, 5))].map((_, i) => (
                      <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              ))}
              {testimonials.length === 0 && (
                <p className="text-gray-400 text-center py-4 text-xs">No testimonials yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Trip Summary */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Upcoming Trip Summary</h3>
            <Link to="/admin/schedules" className="text-[#00C9B7] text-xs hover:underline font-semibold">View Schedules</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-2 pr-3">Tour Package</th>
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3 hidden sm:table-cell">Vehicle</th>
                  <th className="pb-2 pr-3 hidden sm:table-cell">Driver</th>
                  <th className="pb-2 pr-3 text-center">Seats</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingTripSummary.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-3 font-semibold text-gray-900 max-w-[120px]"><span className="truncate block">{s.tripTitle}</span></td>
                    <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">{s.departureDate}</td>
                    <td className="py-2 pr-3 text-gray-500 hidden sm:table-cell">{s.vehicleName || <span className="text-gray-300">—</span>}</td>
                    <td className="py-2 pr-3 text-gray-500 hidden sm:table-cell">{s.driverName || <span className="text-gray-300">—</span>}</td>
                    <td className="py-2 pr-3 text-center font-bold text-gray-700">{s.bookedPersons}/{s.capacity}</td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        s.status === 'upcoming' ? 'bg-blue-50 text-blue-700' :
                        s.status === 'ongoing' ? 'bg-[#E6FAF8] text-[#00A192]' :
                        s.status === 'completed' ? 'bg-green-50 text-green-700' :
                        'bg-red-50 text-red-700'
                      }`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
                {upcomingTripSummary.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-6 text-gray-400">No upcoming departures scheduled</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Link to="/admin/trips" className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-[#E6FAF8] hover:border-[#00C9B7]/30 transition-all group">
              <div className="w-8 h-8 bg-[#E6FAF8] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#00C9B7] transition-colors">
                <MapPin className="w-4 h-4 text-[#00C9B7] group-hover:text-white transition-colors" />
              </div>
              <span className="text-gray-700 text-xs font-semibold">Manage Trips</span>
            </Link>
            <Link to="/admin/bookings" className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-all group">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors">
                <Calendar className="w-4 h-4 text-blue-500 group-hover:text-white transition-colors" />
              </div>
              <span className="text-gray-700 text-xs font-semibold">View Bookings</span>
            </Link>
            <Link to="/admin/gallery" className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-green-50 hover:border-green-200 transition-all group">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500 transition-colors">
                <Activity className="w-4 h-4 text-green-500 group-hover:text-white transition-colors" />
              </div>
              <span className="text-gray-700 text-xs font-semibold">Gallery</span>
            </Link>
            <Link to="/" className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-all group">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500 transition-colors">
                <TrendingUp className="w-4 h-4 text-purple-500 group-hover:text-white transition-colors" />
              </div>
              <span className="text-gray-700 text-xs font-semibold">View Website</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
