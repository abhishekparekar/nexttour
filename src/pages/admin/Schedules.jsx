import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Loader2, Clock, Calendar, Truck, UserCheck, AlertCircle, RefreshCw, Users, Phone } from 'lucide-react';
import { 
  subscribeToSchedules, addSchedule, updateSchedule, deleteSchedule,
  subscribeToTrips, subscribeToVehicles, subscribeToDrivers, subscribeToBookings 
} from '../../firebase';

const AdminSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTravelersModal, setShowTravelersModal] = useState(false);
  const [selectedScheduleForTravelers, setSelectedScheduleForTravelers] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    tripId: '',
    departureDate: '',
    returnDate: '',
    vehicleId: '',
    driverId: '',
    capacity: 15,
    status: 'upcoming'
  });

  useEffect(() => {
    const unsubSchedules = subscribeToSchedules((data) => setSchedules(data));
    const unsubTrips = subscribeToTrips((data) => setTrips(data));
    const unsubVehicles = subscribeToVehicles((data) => setVehicles(data));
    const unsubBookings = subscribeToBookings((data) => setBookings(data));
    const unsubDrivers = subscribeToDrivers((data) => {
      setDrivers(data);
      setLoading(false);
    });

    return () => {
      unsubSchedules();
      unsubTrips();
      unsubVehicles();
      unsubBookings();
      unsubDrivers();
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setFormData({
      tripId: trips[0]?.id || '',
      departureDate: '',
      returnDate: '',
      vehicleId: '',
      driverId: '',
      capacity: 15,
      status: 'upcoming'
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      tripId: schedule.tripId || '',
      departureDate: schedule.departureDate || '',
      returnDate: schedule.returnDate || '',
      vehicleId: schedule.vehicleId || '',
      driverId: schedule.driverId || '',
      capacity: schedule.capacity || 15,
      status: schedule.status || 'upcoming'
    });
    setError(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trip schedule?')) {
      try {
        await deleteSchedule(id);
      } catch (err) {
        setError('Failed to delete scheduled trip');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.tripId || !formData.departureDate || !formData.returnDate) {
      setError('Tour Package, Departure Date, and Return Date are required fields.');
      return;
    }

    try {
      const selectedTrip = trips.find(t => t.id === formData.tripId);
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
      const selectedDriver = drivers.find(d => d.id === formData.driverId);

      const data = {
        ...formData,
        tripTitle: selectedTrip ? selectedTrip.title : 'Unknown Tour',
        vehicleName: selectedVehicle ? `${selectedVehicle.name} (${selectedVehicle.number})` : '',
        driverName: selectedDriver ? selectedDriver.name : '',
        capacity: Number(formData.capacity)
      };

      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, data);
      } else {
        await addSchedule(data);
      }
      setShowModal(false);
    } catch (err) {
      setError('Failed to save schedule details.');
    }
  };

  const filteredSchedules = schedules.filter(s => {
    const matchesSearch = 
      s.tripTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.driverName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    upcoming: 'bg-blue-50 text-blue-700 border border-blue-200',
    ongoing: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    completed: 'bg-green-50 text-green-700 border border-green-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-gray-900">Trips / Schedule</h1>
          <p className="text-gray-600 text-xs mt-0.5">{schedules.length} departures scheduled</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#00C9B7] hover:bg-[#00b3a2] text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all shadow-md"
        >
          <Plus size={18} /> Schedule Trip
        </button>
      </div>

      <div className="p-4">
        {/* Filter Section */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by package name, vehicle, or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="all">All Schedules</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Schedule Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-600 text-xs font-bold uppercase tracking-wide border-b border-gray-200 bg-gray-50/50">
                  <th className="px-3 py-2">Tour Package</th>
                  <th className="px-3 py-2">Departure / Return</th>
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Driver</th>
                  <th className="p-4 text-center">Capacity</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map(schedule => (
                  <tr key={schedule.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 align-middle">
                      <div className="text-gray-900 font-bold text-[13px]">{schedule.tripTitle}</div>
                      <div className="text-gray-600 text-xs">ID: {schedule.tripId}</div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex items-center gap-1.5 text-gray-800 text-xs font-semibold">
                        <Calendar size={13} className="text-gray-400" />
                        {schedule.departureDate} to {schedule.returnDate}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle text-gray-700 text-xs">
                      {schedule.vehicleName ? (
                        <div className="flex items-center gap-1.5">
                          <Truck size={13} className="text-gray-400" /> {schedule.vehicleName}
                        </div>
                      ) : 'Not Assigned'}
                    </td>
                    <td className="px-3 py-2 align-middle text-gray-700 text-xs">
                      {schedule.driverName ? (
                        <div className="flex items-center gap-1.5">
                          <UserCheck size={13} className="text-gray-400" /> {schedule.driverName}
                        </div>
                      ) : 'Not Assigned'}
                    </td>
                    <td className="px-3 py-2 align-middle text-center text-gray-800 text-xs font-bold">{schedule.capacity} seats</td>
                    <td className="px-3 py-2 align-middle">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[schedule.status]}`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedScheduleForTravelers(schedule);
                            setShowTravelersModal(true);
                          }} 
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="View Traveler List"
                        >
                          <Users size={15} className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenEdit(schedule)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors">
                          <Edit2 size={15} className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(schedule.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors">
                          <Trash2 size={15} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block lg:hidden divide-y divide-gray-100">
            {filteredSchedules.map(schedule => (
              <div key={schedule.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 text-[14px]">{schedule.tripTitle}</h4>
                    <p className="text-gray-600 text-xs mt-0.5">ID: {schedule.tripId}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[schedule.status]}`}>
                    {schedule.status}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Departure:</span>
                    <span className="font-semibold text-gray-800">{schedule.departureDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Return:</span>
                    <span className="font-semibold text-gray-800">{schedule.returnDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vehicle:</span>
                    <span className="font-semibold text-gray-800">{schedule.vehicleName || 'Not Assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Driver:</span>
                    <span className="font-semibold text-gray-800">{schedule.driverName || 'Not Assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacity:</span>
                    <span className="font-bold text-gray-850">{schedule.capacity} seats</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedScheduleForTravelers(schedule);
                      setShowTravelersModal(true);
                    }}
                    className="flex-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Users size={13} /> Travelers
                  </button>
                  <button
                    onClick={() => handleOpenEdit(schedule)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredSchedules.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 font-semibold mb-1">No schedules found</h3>
              <p className="text-gray-600 text-sm">Create a departure date configuration to activate schedules.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingSchedule ? 'Edit Schedule Settings' : 'Schedule New Departure'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Select Tour Package *</label>
                <select
                  value={formData.tripId}
                  onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white cursor-pointer"
                >
                  <option value="">-- Select Package --</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Departure Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Return Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.returnDate}
                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Vehicle Assignment</label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white cursor-pointer"
                  >
                    <option value="">-- Not Assigned --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.number})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Driver Assignment</label>
                  <select
                    value={formData.driverId}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white cursor-pointer"
                  >
                    <option value="">-- Not Assigned --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Trip Capacity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Trip Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white cursor-pointer"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-white border border-gray-300 text-gray-700 font-bold py-2.5 px-5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md"
                >
                  {editingSchedule ? 'Save Changes' : 'Create Departure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Traveler List Modal */}
      {showTravelersModal && selectedScheduleForTravelers && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Traveler List</h3>
                <p className="text-gray-600 text-xs">
                  Tour: <strong>{selectedScheduleForTravelers.tripTitle}</strong> | Date: <strong>{selectedScheduleForTravelers.departureDate}</strong>
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowTravelersModal(false);
                  setSelectedScheduleForTravelers(null);
                }} 
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Calculations & List */}
            {(() => {
              const scheduleBookings = bookings.filter(b => 
                b.scheduleId === selectedScheduleForTravelers.id || 
                (b.tripId === selectedScheduleForTravelers.tripId && b.selectedDate === selectedScheduleForTravelers.departureDate)
              );

              const totalTravelers = scheduleBookings.reduce((sum, b) => sum + (Number(b.travelers) || 0), 0);
              const totalAmount = scheduleBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
              const totalPaid = scheduleBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
              const totalPending = totalAmount - totalPaid;

              return (
                <div className="p-4 space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/30">
                      <span className="block text-xs text-gray-400 uppercase tracking-wider font-bold">Total Confirmed</span>
                      <span className="block font-black text-gray-800 text-base mt-1">{totalTravelers} Travelers</span>
                    </div>
                    <div className="border border-gray-200 rounded-2xl p-4 bg-blue-50/10">
                      <span className="block text-xs text-blue-500 uppercase tracking-wider font-bold">Total Booking</span>
                      <span className="block font-black text-blue-700 text-base mt-1">₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="border border-gray-200 rounded-2xl p-4 bg-green-50/20">
                      <span className="block text-xs text-green-500 uppercase tracking-wider font-bold">Collected Amount</span>
                      <span className="block font-black text-green-700 text-base mt-1">₹{totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="border border-gray-200 rounded-2xl p-4 bg-red-50/20">
                      <span className="block text-xs text-red-500 uppercase tracking-wider font-bold">Pending Collection</span>
                      <span className="block font-black text-red-750 text-base mt-1 font-bold">₹{totalPending.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-[45vh] overflow-y-auto bg-white shadow-2xs">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-600 text-xs font-bold uppercase tracking-wide border-b border-gray-200 bg-gray-50/60">
                          <th className="p-3">Customer</th>
                          <th className="p-3">Contact</th>
                          <th className="p-3 text-center">Persons</th>
                          <th className="p-3">Pickup Point</th>
                          <th className="p-3 text-right">Total</th>
                          <th className="p-3 text-right">Paid</th>
                          <th className="p-3 text-right">Pending</th>
                          <th className="p-3">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheduleBookings.map((b, i) => {
                          const remaining = (b.amount || 0) - (b.paidAmount || 0);
                          return (
                            <tr key={b.id || i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                              <td className="p-3 font-semibold text-gray-900 text-xs">{b.name}</td>
                              <td className="p-3 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Phone size={12} className="text-gray-400" /> {b.phone}
                                </span>
                              </td>
                              <td className="p-3 text-center font-bold text-gray-800 text-xs">{b.travelers}</td>
                              <td className="p-3 text-xs text-gray-600 truncate max-w-[120px]">{b.pickupPoint || 'N/A'}</td>
                              <td className="p-3 text-right font-semibold text-gray-950 text-xs">₹{b.amount?.toLocaleString()}</td>
                              <td className="p-3 text-right font-semibold text-green-650 text-xs">₹{(b.paidAmount || 0).toLocaleString()}</td>
                              <td className="p-3 text-right font-semibold text-red-600 text-xs">₹{remaining.toLocaleString()}</td>
                              <td className="p-3 text-xs">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                                  b.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                                  b.paymentStatus === 'partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  {b.paymentStatus || 'pending'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {scheduleBookings.length === 0 && (
                          <tr>
                            <td colSpan="8" className="text-center py-8 text-gray-400 text-sm italic">
                              No traveler reservations confirmed for this departure yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchedules;
