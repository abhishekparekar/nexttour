import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, ChevronDown, ChevronUp, MapPin, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const isSaturday = (dateStr) => {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return dateObj.getDay() === 6;
};

const AllDatesModal = ({ isOpen, onClose, trip }) => {
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);
  const navigate = useNavigate();

  if (!isOpen || !trip) return null;

  // Extract dates from the actual trip data
  const defaultPickup = (trip.pickupLocations && trip.pickupLocations.length > 0) ? trip.pickupLocations[0] : null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const realDates = [
    ...(trip.availableDates || []).map((d, i) => ({
      id: `avail-${i}`,
      type: 'Date',
      date: d,
      time: defaultPickup?.time || (isSaturday(d) ? '10:00 PM' : '6:00 AM'),
      location: defaultPickup?.location || 'Departure Point',
      address: defaultPickup?.address || trip.location || '',
      price: trip.price || 0
    })),
    ...(trip.pickupLocations || []).filter(p => p.date).map((p, i) => ({
      id: p.id || `pickup-${i}`,
      type: 'Pickup',
      date: p.date,
      time: p.time || (isSaturday(p.date) ? '10:00 PM' : '6:00 AM'),
      location: p.location || 'Departure Point',
      address: p.address || '',
      price: trip.price || 0
    }))
  ]
  .filter(item => {
    const d = new Date(item.date);
    return !isNaN(d.getTime()) && d >= now;
  })
  .sort((a, b) => new Date(a.date) - new Date(b.date));

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-4 border-b border-[#e5e5e5]">
              <div>
                <h2 className="text-xl font-bold text-[#111]">All Dates</h2>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{trip.title}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 self-start"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-5">
              <div className="flex flex-col space-y-4">
                {realDates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No upcoming dates configured for this trip yet.
                  </div>
                ) : (
                  realDates.map((item, idx) => (
                    <div key={item.id} className="flex flex-col relative">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                        
                        {/* Left: Large Calendar Icon */}
                        <div className="mt-1 hidden sm:block">
                          <CalendarIcon className="w-8 h-8 text-gray-800" strokeWidth={1.5} />
                        </div>

                        {/* Middle: Details */}
                        <div className="flex-1 flex flex-col gap-3">
                          <div className="flex flex-col">
                            <span className="text-[12px] text-gray-500 font-medium uppercase tracking-wider mb-1">Departure</span>
                            <span className="text-[16px] font-bold text-[#111]">{formatDate(item.date)}</span>
                            <div className="flex items-center gap-1.5 mt-1 text-gray-500">
                              <Clock size={13} className="text-[#00C9B7]"/>
                              <span className="text-[14px] font-medium">{item.time}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-[12px] text-gray-500 font-medium uppercase tracking-wider mb-1">Location</span>
                            <div className="flex items-start gap-1.5 text-[#111]">
                              <MapPin size={14} className="mt-0.5 flex-shrink-0 text-[#00C9B7]" />
                              <div>
                                <span className="text-[14px] font-medium">{item.location}</span>
                                {item.address && (
                                  <span className="block text-[12px] text-gray-500 mt-0.5 leading-snug">{item.address}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Price & Action */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center self-stretch sm:self-center mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-none border-gray-100">
                          <div className="flex flex-col sm:items-end">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Ticket Price</span>
                            <span className="text-[18px] font-black text-[#111]">
                              ₹ {item.price.toLocaleString()}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => {
                              onClose();
                              navigate(`/booking/${trip.id}?date=${item.date}`);
                            }}
                            className="mt-2 bg-[#111] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-black transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            Book <Navigation size={12} className="fill-current" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Divider except for last */}
                      {idx < realDates.length - 1 && (
                        <div className="h-px bg-gray-100 my-2 sm:ml-16" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AllDatesModal;
