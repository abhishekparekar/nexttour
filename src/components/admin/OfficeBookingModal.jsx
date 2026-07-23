import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, MapPin, Plus, Trash2, CreditCard, CheckCircle, Printer, Send, AlertCircle, Building, Contact, DollarSign, Users } from 'lucide-react';
import { getTrips, getSchedules, addBooking, saveCustomer, updateBookingPayments, subscribeToBookings } from '../../firebase';
import { generateBookingId, calculatePaymentStatus, formatCurrency, calculateTripSeatAvailability } from '../../utils/bookingUtils';
import { printBookingConfirmation, printPaymentReceipt } from '../../utils/printTemplates';
import { sendWhatsAppNotification } from '../../utils/whatsapp';

const OfficeBookingModal = ({ isOpen, onClose, onSuccess }) => {
  const [trips, setTrips] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);

  // Form Fields
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  
  // Customer Profile
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [idProofType, setIdProofType] = useState('Aadhaar Card');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Passengers
  const [travelersCount, setTravelersCount] = useState(1);
  const [passengers, setPassengers] = useState([{ name: '', age: '', gender: 'Male' }]);

  // Pricing & Payment
  const [pricePerPerson, setPricePerPerson] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAtCounter, setPaidAtCounter] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');

  // Load Trips, Schedules & Bookings on mount
  useEffect(() => {
    if (!isOpen) return;

    const unsubBookings = subscribeToBookings((data) => setBookings(data || []));

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const fetchedTrips = await getTrips();
        const activeTrips = fetchedTrips.filter(t => t.status === 'active' || !t.status);
        setTrips(activeTrips);

        const fetchedSchedules = await getSchedules();
        setSchedules(fetchedSchedules);

        if (activeTrips.length > 0) {
          handleSelectTrip(activeTrips[0], fetchedSchedules);
        }
      } catch (err) {
        console.error('Error loading data for Office Booking:', err);
        setError('Failed to load trips list. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();

    return () => unsubBookings();
  }, [isOpen]);

  const handleSelectTrip = (trip, allSchedules = schedules) => {
    setSelectedTrip(trip);
    setSelectedTripId(trip.id);
    setPricePerPerson(trip.price || trip.discountPrice || 0);

    // Filter available departure dates for this trip
    const tripSchedules = allSchedules.filter(s => s.tripId === trip.id && s.status !== 'cancelled');
    if (tripSchedules.length > 0) {
      setSelectedDate(tripSchedules[0].departureDate);
    } else if (trip.upcomingDates && trip.upcomingDates.length > 0) {
      setSelectedDate(trip.upcomingDates[0]);
    } else {
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }

    // Set default pickup point if available
    if (trip.pickupPoints && trip.pickupPoints.length > 0) {
      setPickupPoint(trip.pickupPoints[0]);
    } else if (trip.location) {
      setPickupPoint(trip.location);
    } else {
      setPickupPoint('Office Departure Counter');
    }
  };

  const handleTripChange = (tripId) => {
    const found = trips.find(t => t.id === tripId);
    if (found) {
      handleSelectTrip(found);
    }
  };

  const handleTravelersCountChange = (count) => {
    const newCount = Math.max(1, Number(count) || 1);
    setTravelersCount(newCount);

    setPassengers(prev => {
      const updated = [...prev];
      if (newCount > updated.length) {
        for (let i = updated.length; i < newCount; i++) {
          updated.push({ name: i === 0 ? name : '', age: '', gender: 'Male' });
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

  // Pricing calculations
  const rawSubtotal = (Number(pricePerPerson) || 0) * (Number(travelersCount) || 1);
  const discount = Math.max(0, Number(discountAmount) || 0);
  const finalTotalAmount = Math.max(0, rawSubtotal - discount);
  const counterPayment = Math.min(finalTotalAmount, Math.max(0, Number(paidAtCounter) || 0));
  const pendingAmount = finalTotalAmount - counterPayment;
  const computedPaymentStatus = calculatePaymentStatus(finalTotalAmount, counterPayment);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedTrip) {
      setError('Please select a tour package.');
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError('Customer Name and Phone Number are required.');
      return;
    }
    if (phone.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setSubmitting(true);

    try {
      const bookingId = generateBookingId('office');

      // Create transaction if payment received at counter
      const initialPayments = counterPayment > 0 ? [{
        id: `TXN_OFFICE_${Date.now()}`,
        amount: counterPayment,
        date: new Date().toISOString().split('T')[0],
        mode: paymentMode,
        reference: paymentReference.trim() || 'Office Counter Receipt'
      }] : [];

      const bookingPayload = {
        id: bookingId,
        tripId: selectedTrip.id,
        tripName: selectedTrip.title || selectedTrip.name,
        name: name.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        email: email.trim(),
        city: city.trim(),
        idProofType,
        idProofNumber: idProofNumber.trim(),
        selectedDate,
        pickupPoint,
        travelers: Number(travelersCount),
        passengers,
        notes: notes.trim(),
        amount: finalTotalAmount,
        pricePerPerson: Number(pricePerPerson),
        discountAmount: discount,
        paidAmount: counterPayment,
        pendingAmount,
        paymentStatus: computedPaymentStatus,
        status: 'confirmed',
        bookingSource: 'office',
        payments: initialPayments,
        createdAt: new Date().toISOString()
      };

      // Save booking in Firestore
      await addBooking(bookingPayload);

      // Auto save customer details
      await saveCustomer(phone.trim(), {
        name: name.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        city: city.trim(),
        idProofType,
        idProofNumber: idProofNumber.trim(),
        updatedAt: new Date().toISOString()
      });

      setCreatedBooking(bookingPayload);
      if (onSuccess) onSuccess(bookingPayload);
    } catch (err) {
      console.error('Failed to create office booking:', err);
      setError('Failed to create office booking. ' + (err.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCreatedBooking(null);
    setName('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setCity('');
    setIdProofNumber('');
    setNotes('');
    setTravelersCount(1);
    setPassengers([{ name: '', age: '', gender: 'Male' }]);
    setDiscountAmount(0);
    setPaidAtCounter(0);
    setPaymentReference('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00C9B7]/20 flex items-center justify-center text-[#00C9B7] border border-[#00C9B7]/40">
              <Building size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-tight">New Office Counter Booking</h3>
              <p className="text-gray-400 text-xs mt-0.5">Process walk-in customer booking & counter payment</p>
            </div>
          </div>
          <button 
            onClick={resetForm} 
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success View */}
        {createdBooking ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle size={36} />
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-900">Office Booking Created Successfully!</h4>
              <p className="text-gray-500 text-sm mt-1">
                Booking ID: <strong className="text-gray-900 font-mono">{createdBooking.id}</strong> &bull; Customer: <strong className="text-gray-900">{createdBooking.name}</strong>
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 text-left grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block">Package:</span>
                <span className="font-bold text-gray-800 block truncate">{createdBooking.tripName}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Departure:</span>
                <span className="font-bold text-gray-800 block">{createdBooking.selectedDate}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Grand Total:</span>
                <span className="font-bold text-gray-900 block">{formatCurrency(createdBooking.amount)}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Collected at Counter:</span>
                <span className="font-bold text-green-600 block">{formatCurrency(createdBooking.paidAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => printBookingConfirmation(createdBooking)}
                className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-sm"
              >
                <Printer size={16} /> Print Confirmation Slip
              </button>
              <button
                onClick={() => printPaymentReceipt(createdBooking)}
                className="flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-sm"
              >
                <CreditCard size={16} /> Print Payment Receipt
              </button>
              <button
                onClick={() => sendWhatsAppNotification(createdBooking, 'confirmation')}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-sm"
              >
                <Send size={16} /> WhatsApp Confirmation
              </button>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-end">
              <button
                onClick={resetForm}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-6 rounded-xl text-xs transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Package & Departure Selection */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#00C9B7] mb-3 flex items-center gap-1.5">
                <Calendar size={14} /> 1. Select Package & Schedule
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tour Package *</label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => handleTripChange(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-[#00C9B7]"
                    required
                  >
                    {trips.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title || t.name} &bull; {formatCurrency(t.price || t.discountPrice || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Departure Date *</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-[#00C9B7]"
                    required
                  />
                </div>
              </div>

              {/* Live Seat Availability Indicator */}
              {(() => {
                const selectedScheduleObj = schedules.find(s => s.tripId === selectedTripId && s.departureDate === selectedDate);
                const seatInfo = calculateTripSeatAvailability(selectedScheduleObj || { ...selectedTrip, departureDate: selectedDate }, bookings);
                return (
                  <div className="mt-2.5 flex items-center justify-between bg-gray-50 border border-gray-200/80 rounded-xl p-2.5 text-xs">
                    <span className="text-gray-600 font-medium">Trip Seat Capacity Status:</span>
                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] border flex items-center gap-1 ${
                      seatInfo.isFullyBooked 
                        ? 'bg-rose-50 text-rose-700 border-rose-200 font-black' 
                        : seatInfo.remainingSeats <= 5
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      <Users size={12} />
                      {seatInfo.isFullyBooked ? (
                        'FULL / FULLY BOOKED (0 Seats Left)'
                      ) : (
                        `${seatInfo.remainingSeats} Seats Remaining (${seatInfo.bookedPassengers}/${seatInfo.totalCapacity} Booked)`
                      )}
                    </span>
                  </div>
                );
              })()}

              <div className="mt-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">Pickup Point / Boarding Location</label>
                <input
                  type="text"
                  placeholder="e.g. Main Office / Bus Stand / Airport"
                  value={pickupPoint}
                  onChange={(e) => setPickupPoint(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                />
              </div>
            </div>

            {/* 2. Customer Profile Details */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#00C9B7] mb-3 flex items-center gap-1.5">
                <User size={14} /> 2. Walk-In Customer Profile
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (passengers.length > 0 && !passengers[0].name) {
                        handlePassengerChange(0, 'name', e.target.value);
                      }
                    }}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="10 digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    placeholder="Same as phone if empty"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="customer@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">City / Address</label>
                  <input
                    type="text"
                    placeholder="City / Locality"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">ID Proof</label>
                    <select
                      value={idProofType}
                      onChange={(e) => setIdProofType(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-2 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                    >
                      <option value="Aadhaar Card">Aadhaar</option>
                      <option value="Driving License">DL</option>
                      <option value="Passport">Passport</option>
                      <option value="Voter ID">Voter ID</option>
                    </select>
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">ID Number</label>
                    <input
                      type="text"
                      placeholder="ID Number"
                      value={idProofNumber}
                      onChange={(e) => setIdProofNumber(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Passengers Breakdown */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#00C9B7] flex items-center gap-1.5">
                  <Contact size={14} /> 3. Passengers & Group Members
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-gray-600">Total Travelers:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={travelersCount}
                    onChange={(e) => handleTravelersCountChange(e.target.value)}
                    className="w-16 bg-white border border-gray-300 rounded-lg px-2 py-1 text-center font-bold text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {passengers.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200/80 rounded-xl p-2 text-xs">
                    <span className="w-5 text-center font-bold text-gray-400">{idx + 1}.</span>
                    <input
                      type="text"
                      placeholder={`Passenger ${idx + 1} Name`}
                      value={p.name}
                      onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      value={p.age}
                      onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                      className="w-16 bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 text-center focus:outline-none focus:border-[#00C9B7]"
                    />
                    <select
                      value={p.gender}
                      onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                      className="bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Pricing & Counter Payment Collection */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                <DollarSign size={14} className="text-[#00C9B7]" /> 4. Pricing & Counter Payment Collection
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rate Per Traveler (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={pricePerPerson}
                    onChange={(e) => setPricePerPerson(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Special Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Calculated Grand Total</label>
                  <div className="bg-gray-900 text-white font-black text-sm rounded-xl px-3.5 py-2 text-center shadow-inner">
                    {formatCurrency(finalTotalAmount)}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-green-700 mb-1">Amount Collected at Counter (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={finalTotalAmount}
                    value={paidAtCounter}
                    onChange={(e) => setPaidAtCounter(e.target.value)}
                    className="w-full bg-white border border-green-400 rounded-xl px-3.5 py-2 text-xs font-bold text-green-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                  >
                    <option value="cash">Cash Payment</option>
                    <option value="upi">UPI / PhonePe / GPay</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ref / UTR / Receipt No.</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR123456 / Cash Rec #10"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold bg-white p-2.5 rounded-xl border border-gray-200">
                <span className="text-gray-500">Remaining Unpaid Balance:</span>
                <span className={pendingAmount > 0 ? "text-red-600 font-extrabold text-sm" : "text-green-600 font-extrabold text-sm"}>
                  {formatCurrency(pendingAmount)}
                </span>
              </div>
            </div>

            {/* Special Instructions / Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Special Notes / Requests</label>
              <textarea
                rows="2"
                placeholder="Any dietary preferences, seat requests, or office notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
              ></textarea>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-100 pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-5 rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? 'Processing Counter Booking...' : 'Create Office Booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OfficeBookingModal;
