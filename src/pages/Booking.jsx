import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight, User, Map, ShieldAlert, FileText, Users, CreditCard, Calendar, Plus, Trash2, Contact, MapPin } from 'lucide-react';
import { addBooking, getTripById, subscribeToBookings } from '../firebase';
import { calculateTripSeatAvailability, generateBookingId, formatCurrency } from '../utils/bookingUtils';
import { motion } from 'framer-motion';

const isSaturday = (dateStr) => {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return dateObj.getDay() === 6;
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Booking = () => {
  const { tripId } = useParams();
  const [searchParams] = useSearchParams();

  const [trip, setTrip] = useState(null);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [isCustomTrekkers, setIsCustomTrekkers] = useState(false);
  const [allBookings, setAllBookings] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    pickupPoint: '',
    addressCity: '',
    idProofType: 'Aadhaar Card',
    idProofNumber: '',
    notes: '',
    date: '',
    trekkers: 1,
    paymentMode: 'later'
  });

  const [passengers, setPassengers] = useState([
    { name: '', age: '', gender: 'Male' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [error, setError] = useState(null);

  // Subscribe to live bookings for seat capacity tracking
  useEffect(() => {
    const unsub = subscribeToBookings((data) => setAllBookings(data || []));
    return () => unsub();
  }, []);

  const seatInfo = useMemo(() => {
    if (!formData.date) return null;
    return calculateTripSeatAvailability({ ...trip, departureDate: formData.date }, allBookings);
  }, [trip, formData.date, allBookings]);

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
      handleTrekkersCountChange(val);
    }
    if (dateParam) {
      setFormData(prev => ({ ...prev, date: dateParam }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'fullName') {
      setPassengers(prev => {
        const updated = [...prev];
        if (updated.length > 0 && !updated[0].name) {
          updated[0].name = value;
        }
        return updated;
      });
    }
  };

  const handleTrekkersCountChange = (count) => {
    const newCount = Math.max(1, Number(count) || 1);
    setFormData(prev => ({ ...prev, trekkers: newCount }));

    setPassengers(prev => {
      const updated = [...prev];
      if (newCount > updated.length) {
        for (let i = updated.length; i < newCount; i++) {
          updated.push({ name: i === 0 ? formData.fullName : '', age: '', gender: 'Male' });
        }
      } else {
        updated.splice(newCount);
      }
      return updated;
    });
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const unitPrice = Number(trip?.price || trip?.discountPrice || 0);
    const trekkersCount = Number(formData.trekkers) || 1;
    const totalAmount = unitPrice * trekkersCount;
    const advanceAmount = Math.round(totalAmount * 0.20);

    const paymentToProcess = formData.paymentMode === 'full'
      ? totalAmount
      : (formData.paymentMode === 'advance' ? advanceAmount : 0);

    const bookingId = generateBookingId('web');

    const bookingPayload = {
      id: bookingId,
      name: formData.fullName.trim(),
      phone: formData.phone.trim(),
      whatsapp: formData.whatsappNumber.trim() || formData.phone.trim(),
      email: formData.email.trim(),
      city: formData.addressCity.trim(),
      pickupPoint: formData.pickupPoint || (trip?.pickupLocations?.[0]?.location || 'Main Departure Point'),
      idProofType: formData.idProofType,
      idProofNumber: formData.idProofNumber.trim(),
      notes: formData.notes.trim(),
      tripId: tripId || 'direct-booking',
      tripName: trip?.title || 'Trek Adventure',
      selectedDate: formData.date,
      travelers: trekkersCount,
      passengers: passengers,
      bookingDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      amount: totalAmount,
      paidAmount: 0,
      pendingAmount: totalAmount,
      paymentStatus: 'pending',
      status: 'confirmed',
      bookingSource: 'website',
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
          amount: paymentToProcess * 100, // in paise
          currency: "INR",
          name: trip?.categoryName || "NextTour",
          description: `Booking for ${trip?.title || 'Trek'}`,
          handler: async function (response) {
            try {
              bookingPayload.paidAmount = paymentToProcess;
              bookingPayload.pendingAmount = Math.max(0, totalAmount - paymentToProcess);
              bookingPayload.paymentStatus = paymentToProcess >= totalAmount ? 'paid' : 'partial';
              bookingPayload.payments = [{
                id: response.razorpay_payment_id || `TXN_${Date.now()}`,
                amount: paymentToProcess,
                date: new Date().toISOString(),
                mode: 'razorpay',
                reference: response.razorpay_payment_id
              }];

              await addBooking(bookingPayload);
              setCreatedBooking(bookingPayload);
              setIsSubmitted(true);
            } catch (err) {
              console.error('Firestore save error after payment:', err);
              setError('Payment was successful, but booking could not be saved: ' + (response.razorpay_payment_id || '') + '. Please contact support.');
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
            ondismiss: function () {
              setIsSubmitting(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        await addBooking(bookingPayload);
        setCreatedBooking(bookingPayload);
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Failed to submit booking: ' + (err.message || 'Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-[#f8f9fa] border-b-2 border-[#e5e5e5] px-4 py-3 text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#00C9B7] focus:bg-[#E6FAF8] transition-all duration-300 rounded-xl text-xs font-medium";
  const labelClass = "block text-[#555] text-xs font-bold uppercase tracking-wider mb-1.5";

  if (isSubmitted && createdBooking) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center pt-20 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 md:p-12 max-w-xl text-center border border-[#e5e5e5] shadow-xl space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-[6px] border-emerald-100 shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#111] tracking-tight">Trip Booking Confirmed!</h2>
            <p className="text-gray-500 text-xs mt-1">
              Booking ID: <strong className="font-mono text-gray-900">{createdBooking.id}</strong> &bull; Customer: <strong className="text-gray-900">{createdBooking.name}</strong>
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-left grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[11px]">Tour Package:</span>
              <span className="font-bold text-gray-900 block truncate">{createdBooking.tripName}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Departure Date:</span>
              <span className="font-bold text-gray-900 block">{createdBooking.selectedDate}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Travelers Count:</span>
              <span className="font-bold text-gray-900 block">{createdBooking.travelers} Pax</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[11px]">Payment Status:</span>
              <span className={`font-extrabold uppercase text-[11px] ${createdBooking.paidAmount >= createdBooking.amount ? 'text-emerald-700' : 'text-amber-700'}`}>
                {createdBooking.paidAmount >= createdBooking.amount ? 'Paid in Full' : `₹${createdBooking.paidAmount} Paid (₹${createdBooking.pendingAmount} Due)`}
              </span>
            </div>
          </div>

          <p className="text-gray-600 text-xs leading-relaxed">
            Our team will contact you shortly with boarding details. Thank you for choosing NextTour!
          </p>

          <div className="pt-2">
            <Link to="/" className="inline-flex items-center justify-center gap-2 bg-[#111] text-white font-bold py-3.5 px-8 rounded-full hover:bg-[#00C9B7] hover:text-[#111] transition-all text-xs shadow-md">
              Return Home <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-16">
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

      <div className="max-w-[760px] mx-auto px-4 py-8 lg:py-12">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-bold shadow-xs"
          >
            <AlertCircle size={20} className="flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#f0f0f0] space-y-6"
          >
            {/* 1. Customer Profile Section */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#00C9B7] mb-3 flex items-center gap-1.5">
                <User size={15} /> 1. Customer Contact & Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter customer full name"
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
                    placeholder="10 digit mobile number"
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
                    placeholder="Same as mobile if empty"
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
                    placeholder="Email address (optional)"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Address / City</label>
                  <input
                    type="text"
                    name="addressCity"
                    value={formData.addressCity}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="City or home address (optional)"
                  />
                </div>
              </div>
            </div>

            {/* 2. Identity Verification Section */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#00C9B7] mb-3 flex items-center gap-1.5">
                <Contact size={15} /> 2. ID Verification Proof
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>ID Proof Type</label>
                  <select
                    name="idProofType"
                    value={formData.idProofType}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>ID Proof Number</label>
                  <input
                    type="text"
                    name="idProofNumber"
                    value={formData.idProofNumber}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter ID proof number"
                  />
                </div>
              </div>
            </div>

            {/* 3. Trip Date & Pickup Section */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#00C9B7] mb-3 flex items-center gap-1.5">
                <Calendar size={15} /> 3. Departure Date & Pickup Point
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass}>Preferred Departure Date *</label>
                    {availableBatches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setUseCustomDate(!useCustomDate)}
                        className="text-[10px] font-black text-[#0057ff] hover:underline uppercase"
                      >
                        {useCustomDate ? 'Batches' : 'Custom Date'}
                      </button>
                    )}
                  </div>

                  {availableBatches.length > 0 && !useCustomDate ? (
                    <select
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">-- Select Departure Date --</option>
                      {availableBatches.map((b, idx) => (
                        <option key={idx} value={b.date}>
                          {b.date} ({b.time} - {b.location})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input type="date" name="date" required value={formData.date} onChange={handleChange} className={inputClass} />
                  )}
                </div>

                <div>
                  <label className={labelClass}>Boarding / Pickup Point</label>
                  {trip?.pickupLocations && trip.pickupLocations.length > 0 ? (
                    <select
                      name="pickupPoint"
                      value={formData.pickupPoint}
                      onChange={handleChange}
                      className={inputClass}
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
                      placeholder="e.g. Railway Station / Bus Stand"
                    />
                  )}
                </div>
              </div>

              {/* Live Seat Availability Banner */}
              {seatInfo && (
                <div className="mt-3 flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-2xl text-xs">
                  <span className="text-emerald-900 font-bold flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-600" /> Live Seat Availability Status:
                  </span>
                  <span className={`font-extrabold px-3 py-1 rounded-full text-xs border ${
                    seatInfo.isFullyBooked 
                      ? 'bg-rose-50 text-rose-700 border-rose-200 font-black' 
                      : seatInfo.remainingSeats <= 5
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {seatInfo.isFullyBooked ? (
                      '🔴 FULLY BOOKED (0 Seats Left)'
                    ) : (
                      `🔥 ${seatInfo.remainingSeats} Seats Available (${seatInfo.bookedPassengers}/${seatInfo.totalCapacity} Booked)`
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* 4. Passengers Roster Section */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#00C9B7] flex items-center gap-1.5">
                  <Users size={15} /> 4. Passengers Roster ({formData.trekkers} Trekkers)
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Count:</span>
                  <select
                    value={formData.trekkers}
                    onChange={(e) => handleTrekkersCountChange(e.target.value)}
                    className="bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold text-gray-900"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(n => (
                      <option key={n} value={n}>{n} Pax</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {passengers.map((p, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3 text-xs space-y-2">
                    <span className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">
                      Passenger #{idx + 1} {idx === 0 ? '(Primary Traveler)' : ''}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        placeholder="Passenger Name"
                        value={p.name}
                        onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                        className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900"
                        required
                      />

                      <input
                        type="number"
                        placeholder="Age"
                        value={p.age}
                        onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                        className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900"
                      />

                      <select
                        value={p.gender}
                        onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                        className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-bold"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Payment Options & Dynamic Calculation Breakdown */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#00C9B7] mb-2 flex items-center gap-1.5">
                  <CreditCard size={15} /> 5. Select Payment Option
                </h3>
                <p className="text-xs text-gray-500 mb-3">Choose how you want to pay for your trip reservation</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMode === 'full' ? 'border-[#00C9B7] bg-[#E6FAF8] shadow-xs' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <input type="radio" name="paymentMode" value="full" checked={formData.paymentMode === 'full'} onChange={handleChange} className="sr-only" />
                    <span className="font-bold text-[#111] text-sm">Full 100% Payment</span>
                    <span className="text-[11px] text-gray-500 mt-0.5">Pay entire ticket price now</span>
                    <span className="text-base font-black text-[#00C9B7] mt-2">₹{((trip?.price || 0) * formData.trekkers).toLocaleString()}</span>
                  </label>

                  <label className={`flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMode === 'advance' ? 'border-[#00C9B7] bg-[#E6FAF8] shadow-xs' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <input type="radio" name="paymentMode" value="advance" checked={formData.paymentMode === 'advance'} onChange={handleChange} className="sr-only" />
                    <span className="font-bold text-[#111] text-sm">Token Advance (20%)</span>
                    <span className="text-[11px] text-gray-500 mt-0.5">Reserve seat now, pay rest later</span>
                    <span className="text-base font-black text-emerald-700 mt-2">₹{Math.round(((trip?.price || 0) * formData.trekkers) * 0.20).toLocaleString()}</span>
                  </label>

                  <label className={`flex flex-col p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMode === 'later' ? 'border-[#00C9B7] bg-[#E6FAF8] shadow-xs' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <input type="radio" name="paymentMode" value="later" checked={formData.paymentMode === 'later'} onChange={handleChange} className="sr-only" />
                    <span className="font-bold text-[#111] text-sm">Pay at Pickup / Cash</span>
                    <span className="text-[11px] text-gray-500 mt-0.5">Pay 100% on trip departure</span>
                    <span className="text-base font-black text-gray-500 mt-2">₹0 Online</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Price Calculation Summary Box */}
              {(() => {
                const unitPrice = Number(trip?.price) || 0;
                const trekkers = Number(formData.trekkers) || 1;
                const total = unitPrice * trekkers;
                const payNow = formData.paymentMode === 'full' 
                  ? total 
                  : (formData.paymentMode === 'advance' ? Math.round(total * 0.20) : 0);
                const payLater = total - payNow;

                return (
                  <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Ticket Rate:</span>
                      <span className="font-bold text-gray-900">₹{unitPrice.toLocaleString()} &times; {trekkers} Pax</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Total Package Value:</span>
                      <span className="font-bold text-gray-900">₹{total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-emerald-700 font-extrabold pt-2 border-t border-gray-200">
                      <span>Payable Amount Now:</span>
                      <span className="text-sm text-emerald-700">₹{payNow.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-500 text-[11px]">
                      <span>Remaining Balance Due at Pickup:</span>
                      <span className="font-bold text-rose-600">₹{payLater.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-[#f0f0f0]">
              <p className="text-[#717171] text-xs text-center sm:text-left leading-relaxed">
                By booking, you agree to our Terms of Service &amp; Privacy Policy.
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-[#111] text-white font-bold py-3.5 px-10 rounded-full hover:bg-[#00C9B7] hover:text-[#111] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-lg cursor-pointer"
              >
                {isSubmitting ? 'Processing...' : 'Confirm & Reserve Trip'}
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
