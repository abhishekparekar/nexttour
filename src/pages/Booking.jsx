import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight, User, Map, ShieldAlert, FileText } from 'lucide-react';
import { addBooking, getTripById } from '../firebase';
import { motion } from 'framer-motion';

const isSaturday = (dateStr) => {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return dateObj.getDay() === 6;
};

const Booking = () => {
  const { tripId } = useParams();
  const [searchParams] = useSearchParams();
  
  const [trip, setTrip] = useState(null);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [isCustomTrekkers, setIsCustomTrekkers] = useState(false);

  // Initialize form data with URL params if available
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    pickupPoint: '',
    addressCity: '',
    notes: '',
    date: '',
    trekkers: 1,
    paymentMode: 'later'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Trip details and batches
  useEffect(() => {
    const fetchTripData = async () => {
      if (tripId && tripId !== 'direct-booking') {
        try {
          const tripData = await getTripById(tripId);
          if (tripData) {
            setTrip(tripData);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const defaultPickup = (tripData.pickupLocations && tripData.pickupLocations.length > 0) ? tripData.pickupLocations[0] : null;
            
            const batches = [
              ...(tripData.availableDates || []).map(d => ({
                date: d,
                time: defaultPickup?.time || (isSaturday(d) ? '10:00 PM' : '6:00 AM'),
                location: defaultPickup?.location || 'Departure Point'
              })),
              ...(tripData.pickupLocations || []).filter(p => p.date).map(p => ({
                date: p.date,
                time: p.time || (isSaturday(p.date) ? '10:00 PM' : '6:00 AM'),
                location: p.location || 'Departure Point'
              }))
            ]
            .filter(item => {
              const d = new Date(item.date);
              return !isNaN(d.getTime()) && d >= now;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

            setAvailableBatches(batches);
            const dateParam = searchParams.get('date');
            if (!dateParam && batches.length > 0) {
              setFormData(prev => ({ ...prev, date: prev.date || batches[0].date }));
            }
          }
        } catch (err) {
          console.error("Error fetching trip for booking:", err);
        }
      }
    };
    fetchTripData();
  }, [tripId, searchParams]);

  // Set initial date and trekkers from URL params
  useEffect(() => {
    const dateParam = searchParams.get('date');
    const trekkersParam = searchParams.get('trekkers');
    if (trekkersParam) {
      const val = parseInt(trekkersParam);
      setFormData(prev => ({
        ...prev,
        date: dateParam || prev.date,
        trekkers: val
      }));
      if (![1,2,3,4,5,6,7,8,9,10,15,20].includes(val)) {
        setIsCustomTrekkers(true);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        date: dateParam || prev.date
      }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const totalAmount = (trip?.price || 0) * formData.trekkers;
    const advanceAmount = Math.round(totalAmount * 0.20);
    const paymentToProcess = formData.paymentMode === 'full' 
      ? totalAmount 
      : (formData.paymentMode === 'advance' ? advanceAmount : 0);

    const bookingData = {
      name: formData.fullName,
      phone: formData.phone,
      whatsapp: formData.whatsappNumber || formData.phone,
      email: formData.email || '',
      pickupPoint: formData.pickupPoint || 'Main Pickup Point',
      city: formData.addressCity || '',
      notes: formData.notes || '',
      tripId: tripId || 'direct-booking',
      tripName: trip?.title || 'Trek Booking',
      selectedDate: formData.date,
      travelers: formData.trekkers,
      bookingDate: new Date().toISOString().split('T')[0],
      amount: totalAmount,
      paidAmount: 0,
      pendingAmount: totalAmount,
      paymentStatus: 'pending',
      status: 'pending',
      payments: []
    };

    try {
      if (paymentToProcess > 0) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setError('Failed to load Razorpay payment gateway script. Please check your internet connection.');
          setIsSubmitting(false);
          return;
        }

        const options = {
          key: "rzp_test_SndmEhyiZ6FWtK",
          amount: paymentToProcess * 100, // paise
          currency: "INR",
          name: trip?.categoryName || "NextTour",
          description: `Booking for ${trip?.title || 'Trek'}`,
          handler: async function (response) {
            try {
              bookingData.paidAmount = paymentToProcess;
              bookingData.pendingAmount = totalAmount - paymentToProcess;
              bookingData.paymentStatus = paymentToProcess === totalAmount ? 'paid' : 'partial';
              bookingData.status = 'confirmed';
              bookingData.payments = [{
                id: response.razorpay_payment_id,
                amount: paymentToProcess,
                date: new Date().toISOString(),
                mode: 'razorpay',
                reference: response.razorpay_payment_id
              }];

              await addBooking(bookingData);
              setIsSubmitted(true);
            } catch (err) {
              console.error('Firestore save error after payment:', err);
              setError('Payment was successful, but booking could not be saved: ' + response.razorpay_payment_id + '. Please contact support.');
            }
          },
          prefill: {
            name: formData.fullName,
            contact: formData.phone,
            email: formData.email
          },
          theme: {
            color: "#00C9B7"
          },
          modal: {
            ondismiss: function() {
              setIsSubmitting(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        await addBooking(bookingData);
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Failed to submit booking. Please try again.');
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-[#f8f9fa] border-b-2 border-[#e5e5e5] px-4 py-3.5 text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#00C9B7] focus:bg-[#E6FAF8] transition-all duration-300 rounded-t-xl text-sm";
  const labelClass = "block text-[#555] text-xs font-bold uppercase tracking-wider mb-2";
  const sectionClass = "bg-white rounded-3xl p-8 lg:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#f0f0f0] mb-8";

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center pt-20 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-12 max-w-xl text-center border border-[#e5e5e5] shadow-xl"
        >
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border-[6px] border-green-100">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-[#111] mb-4">Booking Submitted!</h2>
          <p className="text-[#555] mb-8 leading-relaxed text-lg">Thank you for your booking request. Our experts will review your details and contact you within 24 hours to confirm your trek.</p>
          <Link to="/" className="inline-flex items-center justify-center gap-2 bg-[#111] text-white font-bold py-4 px-10 rounded-full hover:bg-[#00C9B7] hover:text-[#111] transition-all duration-300 group">
            Return Home <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Hero Banner */}
      <div className="relative h-[32vh] min-h-[240px] w-full overflow-hidden rounded-b-3xl shadow-md">
        <img 
          src={trip?.image || "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2000"} 
          alt="Booking Banner" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-md">
              {trip ? `Book ${trip.title}` : 'Reserve Your Adventure'}
            </h1>
            <p className="text-base md:text-lg text-gray-200 max-w-2xl mx-auto font-medium drop-shadow-sm">
              {trip?.duration ? `${trip.duration} | ₹${trip.price || 0} per person` : 'Just a few details to secure your spot in the wild.'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto px-4 py-8 lg:py-12">
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 font-medium shadow-sm"
          >
            <AlertCircle size={24} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#f0f0f0]"
          >
            <div className="grid grid-cols-1 gap-6">
              
              <div>
                <label className={labelClass}>Full Name *</label>
                <input 
                  type="text" 
                  name="fullName" 
                  required 
                  value={formData.fullName} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="Enter your full name" 
                />
              </div>

              <div>
                <label className={labelClass}>Phone Number *</label>
                <input 
                  type="tel" 
                  name="phone" 
                  required 
                  value={formData.phone} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="+91 98765 43210" 
                />
              </div>

              <div>
                <label className={labelClass}>WhatsApp Number</label>
                <input 
                  type="tel" 
                  name="whatsappNumber" 
                  value={formData.whatsappNumber} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="Enter WhatsApp number (optional)" 
                />
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="Enter email address (optional)" 
                />
              </div>

              <div>
                <label className={labelClass}>Address / City</label>
                <input 
                  type="text" 
                  name="addressCity" 
                  value={formData.addressCity} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="Enter your address or city (optional)" 
                />
              </div>

              <div>
                <label className={labelClass}>Pickup Point</label>
                {trip?.pickupLocations && trip.pickupLocations.length > 0 ? (
                  <select 
                    name="pickupPoint" 
                    value={formData.pickupPoint} 
                    onChange={handleChange} 
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">-- Select Pickup Point --</option>
                    {trip.pickupLocations.map((loc, idx) => (
                      <option key={idx} value={loc.location || loc}>{loc.location || loc} {loc.time ? `(${loc.time})` : ''}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    name="pickupPoint" 
                    value={formData.pickupPoint} 
                    onChange={handleChange} 
                    className={inputClass} 
                    placeholder="Enter pickup point (e.g. Railway Station)" 
                  />
                )}
              </div>

              <div>
                <label className={labelClass}>Special Instructions / Notes</label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleChange} 
                  className={`${inputClass} h-24 resize-none`} 
                  placeholder="Enter any special requests or instructions (optional)"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#555]">Preferred Departure Date *</label>
                  {availableBatches.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUseCustomDate(!useCustomDate)}
                      className="text-[10px] font-black text-[#0057ff] hover:underline uppercase tracking-wider"
                    >
                      {useCustomDate ? 'Select from Batches' : 'Pick Custom Date'}
                    </button>
                  )}
                </div>

                {availableBatches.length > 0 && !useCustomDate ? (
                  <select
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className={`${inputClass} cursor-pointer appearance-none bg-no-repeat`}
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23111%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
                  >
                    <option value="">-- Select Departure Date --</option>
                    {availableBatches.map((b, idx) => {
                      const formattedDate = new Date(b.date).toLocaleDateString('en-IN', {
                        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                      });
                      return (
                        <option key={idx} value={b.date}>
                          {formattedDate} ({b.time} - {b.location})
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input type="date" name="date" required value={formData.date} onChange={handleChange} className={inputClass} />
                )}
              </div>

              <div>
                <label className={labelClass}>Number of Trekkers *</label>
                <select 
                  name="trekkers" 
                  value={isCustomTrekkers ? "custom" : formData.trekkers} 
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomTrekkers(true);
                      setFormData(prev => ({ ...prev, trekkers: 16 }));
                    } else {
                      setIsCustomTrekkers(false);
                      setFormData(prev => ({ ...prev, trekkers: parseInt(e.target.value) }));
                    }
                  }} 
                  className={`${inputClass} cursor-pointer appearance-none bg-no-repeat`} 
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23111%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}
                >
                  {[1,2,3,4,5,6,7,8,9,10,15,20].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'People'}</option>)}
                  <option value="custom">More than 15 (Custom)</option>
                </select>

                {isCustomTrekkers && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className={labelClass}>Enter Number of Trekkers (More than 15) *</label>
                    <input 
                      type="number" 
                      name="customTrekkers"
                      min="16"
                      required 
                      value={formData.trekkers} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || '';
                        setFormData(prev => ({ ...prev, trekkers: val }));
                      }} 
                      className={inputClass} 
                      placeholder="Enter count (e.g. 18)" 
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-[#f0f0f0] pt-6">
                <label className={labelClass}>Payment Option</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <label className={`flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMode === 'full' ? 'border-[#00C9B7] bg-[#E6FAF8]' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="paymentMode" value="full" checked={formData.paymentMode === 'full'} onChange={handleChange} className="sr-only" />
                    <span className="font-bold text-[#111] text-sm">Full Payment</span>
                    <span className="text-xs text-gray-500 mt-1">Pay 100% now</span>
                    <span className="text-lg font-black text-[#111] mt-3">₹{((trip?.price || 0) * formData.trekkers).toLocaleString()}</span>
                  </label>

                  <label className={`flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMode === 'advance' ? 'border-[#00C9B7] bg-[#E6FAF8]' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="paymentMode" value="advance" checked={formData.paymentMode === 'advance'} onChange={handleChange} className="sr-only" />
                    <span className="font-bold text-[#111] text-sm">Pay Advance</span>
                    <span className="text-xs text-gray-500 mt-1">Pay 20% to book</span>
                    <span className="text-lg font-black text-[#111] mt-3">₹{Math.round(((trip?.price || 0) * formData.trekkers) * 0.20).toLocaleString()}</span>
                  </label>

                  <label className={`flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMode === 'later' ? 'border-[#00C9B7] bg-[#E6FAF8]' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="paymentMode" value="later" checked={formData.paymentMode === 'later'} onChange={handleChange} className="sr-only" />
                    <span className="font-bold text-[#111] text-sm">Pay Offline</span>
                    <span className="text-xs text-gray-500 mt-1">Book now, pay later</span>
                    <span className="text-lg font-black text-gray-400 mt-3">₹0</span>
                  </label>
                </div>
              </div>

            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-[#f0f0f0]">
              <p className="text-[#717171] text-xs text-center sm:text-left leading-relaxed">
                By booking, you agree to our <a href="#" className="text-[#111] font-bold hover:underline">Terms of Service</a> &amp; <a href="#" className="text-[#111] font-bold hover:underline">Privacy Policy</a>.
              </p>
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-[#111] text-white font-bold py-4 px-12 rounded-full hover:bg-[#00C9B7] hover:text-[#111] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
                {!isSubmitting && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default Booking;
