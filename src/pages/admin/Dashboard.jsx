import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mountain, Calendar, Users, Star, TrendingUp, DollarSign, Activity, Loader2, Wallet } from 'lucide-react';
import { 
  subscribeToTrips, subscribeToBookings, subscribeToTestimonials, 
  subscribeToSchedules, subscribeToExpenses 
} from '../../firebase';

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
          <TrendingUp size={14} /> {trend}
        </span>
      )}
    </div>
    <div>
      <div className="text-2xl font-black text-gray-900 mb-1 leading-tight">{value}</div>
      <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</div>
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
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Welcome to Arya Cline Admin Panel</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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
          <StatCard 
            icon={TrendingUp} 
            label="Trip Expenses" 
            value={`₹${totalExpenses.toLocaleString()}`} 
            color="bg-gradient-to-br from-yellow-500 to-amber-500"
          />
          <StatCard 
            icon={Activity} 
            label="Total Net Profit" 
            value={`₹${totalProfit.toLocaleString()}`} 
            color="bg-gradient-to-br from-blue-500 to-cyan-500"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
              <Link to="/admin/bookings" className="text-primary-600 text-sm hover:underline font-semibold">View All</Link>
            </div>
            <div className="space-y-3">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-gray-800 font-semibold">{booking.name || 'Guest'}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{booking.tripName || booking.tripId}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              ))}
              {bookings.length === 0 && (
                <p className="text-gray-400 text-center py-4 text-sm">No bookings yet</p>
              )}
            </div>
          </div>

          {/* Active Trips */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Trips</h3>
              <Link to="/admin/trips" className="text-primary-600 text-sm hover:underline font-semibold">Manage</Link>
            </div>
            <div className="space-y-3">
              {trips.filter(t => t.status === 'active').slice(0, 5).map((trip) => (
                <div key={trip.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                  <img src={trip.images?.[0]} alt={trip.title} className="w-12 h-10 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-1">
                    <div className="text-gray-800 font-semibold text-sm">{trip.title}</div>
                    <div className="text-gray-500 text-xs">₹{trip.price?.toLocaleString()}</div>
                  </div>
                  {trip.featured && <span className="text-yellow-500 text-sm">⭐</span>}
                </div>
              ))}
              {activeTrips === 0 && (
                <p className="text-gray-400 text-center py-4 text-sm">No active trips</p>
              )}
            </div>
          </div>

          {/* Recent Testimonials */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
              <Link to="/admin/testimonials" className="text-primary-600 text-sm hover:underline font-semibold">Manage</Link>
            </div>
            <div className="space-y-3">
              {testimonials.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-primary-600 font-bold">
                      {t.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-gray-800 font-semibold text-sm">{t.name}</div>
                    <div className="text-gray-500 text-xs line-clamp-1 mt-0.5">{t.text}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} size={12} className="text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>
                </div>
              ))}
              {testimonials.length === 0 && (
                <p className="text-gray-400 text-center py-4 text-sm">No testimonials yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Trip Summary */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Trip Summary</h3>
            <Link to="/admin/schedules" className="text-primary-600 text-sm hover:underline font-semibold">View Schedules</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-450 text-xs font-bold uppercase tracking-wider border-b border-gray-250 bg-gray-55/50">
                  <th className="p-4">Tour Package</th>
                  <th className="p-4">Departure Date</th>
                  <th className="p-4">Assigned Vehicle</th>
                  <th className="p-4">Assigned Driver</th>
                  <th className="p-4 text-center">Booked Seats</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingTripSummary.map(s => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 align-middle font-semibold text-gray-900 text-sm">{s.tripTitle}</td>
                    <td className="p-4 align-middle text-gray-600 text-xs">{s.departureDate}</td>
                    <td className="p-4 align-middle text-gray-600 text-xs">{s.vehicleName || 'Not Assigned'}</td>
                    <td className="p-4 align-middle text-gray-600 text-xs">{s.driverName || 'Not Assigned'}</td>
                    <td className="p-4 align-middle text-center text-gray-800 text-xs font-bold">
                      {s.bookedPersons} / {s.capacity}
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.status === 'upcoming' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        s.status === 'ongoing' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        s.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {upcomingTripSummary.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-gray-400 text-sm">No upcoming departures scheduled</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/trips" className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                <Mountain className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-gray-700 text-sm font-semibold">Manage Trips</span>
            </Link>
            <Link to="/admin/bookings" className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-gray-700 text-sm font-semibold">View Bookings</span>
            </Link>
            <Link to="/admin/gallery" className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-gray-700 text-sm font-semibold">Update Gallery</span>
            </Link>
            <Link to="/" className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-gray-700 text-sm font-semibold">View Website</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
