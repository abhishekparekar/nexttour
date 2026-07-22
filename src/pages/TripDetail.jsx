import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, Shield, ArrowRight, Calendar, X, Share2, Heart, ChevronRight, ChevronLeft, Loader2, Mountain, ChevronDown, Check, Compass, Plus, Minus, Users, Download } from 'lucide-react';
import { getTripById, getTrips, saveLead } from '../firebase';
import AllDatesModal from '../components/AllDatesModal';
import LeadCaptureModal from '../components/LeadCaptureModal';

const formatItineraryText = (text) => {
  if (!text) return '';
  return text.replace(/([.,])(?!\d)\s*(?!$)/g, '$1\n');
};

const isSaturday = (dateStr) => {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return dateObj.getDay() === 6;
};

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTrekkers, setSelectedTrekkers] = useState(1);
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [relatedTrips, setRelatedTrips] = useState([]);

  // New States for Redesign
  const [activeTab, setActiveTab] = useState('About');
  const [showHighlights, setShowHighlights] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const tripData = await getTripById(id);
        if (tripData) setTrip(tripData);
      } catch (error) {
        console.error('Error fetching trip:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTrip();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchRelatedTrips = async () => {
      if (!trip) return;
      try {
        const allTrips = await getTrips();
        const filtered = allTrips.filter(t => t.id !== trip.id);
        const sameCategory = filtered.filter(t => t.categoryId === trip.categoryId || t.categoryName === trip.categoryName);
        const otherTrips = filtered.filter(t => t.categoryId !== trip.categoryId && t.categoryName !== trip.categoryName);
        setRelatedTrips([...sameCategory.slice(0, 3), ...otherTrips.slice(0, 3)]);
      } catch (error) {
        console.error('Error fetching related trips:', error);
      }
    };
    if (trip) fetchRelatedTrips();
  }, [trip]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: trip?.title || 'NextTour', url: url });
      } catch (err) {
        console.log('User canceled share');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleBooking = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dates = [
      ...(trip?.availableDates || []).map(d => ({ date: d })),
      ...(trip?.pickupLocations || []).filter(p => p.date).map(p => ({ date: p.date }))
    ].filter(item => {
      const d = new Date(item.date);
      return !isNaN(d.getTime()) && d >= now;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const nextDate = dates.length > 0 ? dates[0].date : '';
    navigate(`/booking/${id}${nextDate ? `?date=${nextDate}` : ''}`);
  };

  const handleDownloadPDF = () => {
    setIsLeadModalOpen(true);
  };

  const handleLeadSubmit = async ({ name, phone, city }) => {
    await saveLead(phone, {
      name,
      city,
      lastDownloadedTripId: id,
      lastDownloadedTripTitle: trip.title
    });
    executeDownloadPDF();
  };

  const executeDownloadPDF = () => {
    const cleanText = (text) => {
      if (!text) return '';
      return text
        .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // Remove 4-byte surrogate pairs (most emojis)
        .replace(/[\u2600-\u27BF]/g, '')               // Remove standard miscellaneous symbols and dingbats
        .replace(/[\uE000-\uF8FF]/g, '')               // Private Use Area (some custom emojis)
        .trim();
    };

    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 20;

      // Title & Price
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(cleanText(trip.title), 14, y);
      y += 10;
      doc.setFontSize(16);
      doc.setTextColor(0, 128, 0);
      doc.text(`Price: Rs. ${trip.price}`, 14, y);
      y += 15;

      // Highlights
      if (trip.highlights && trip.highlights.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Highlights', 14, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        trip.highlights.forEach(highlight => {
          doc.text(`• ${cleanText(highlight)}`, 18, y);
          y += 6;
        });
        y += 5;
      }

      // About
      if (trip.description) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('About this trip', 14, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const splitDesc = doc.splitTextToSize(cleanText(trip.description), 180);
        doc.text(splitDesc, 14, y);
        y += (splitDesc.length * 6) + 10;
      }

      // Automatically add new page if y is getting too low
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Itinerary
      if (trip.itinerary && trip.itinerary.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Itinerary', 14, y);
        y += 8;
        doc.setFontSize(11);
        trip.itinerary.forEach((day) => {
          doc.setFont('helvetica', 'bold');
          doc.text(`Day ${day.day}: ${cleanText(day.title)}`, 14, y);
          y += 6;
          doc.setFont('helvetica', 'normal');
          const splitActivities = doc.splitTextToSize(cleanText(formatItineraryText(day.description || day.activities || '')), 180);
          doc.text(splitActivities, 14, y);
          y += (splitActivities.length * 6) + 6;

          if (y > 260) {
            doc.addPage();
            y = 20;
          }
        });
        y += 5;
      }

      // Inclusions & Exclusions
      if (y > 220) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Inclusions', 14, y);
      y += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      (trip.inclusions || []).forEach(item => {
        doc.text(`• ${cleanText(item)}`, 18, y);
        y += 6;
      });

      y += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Exclusions', 14, y);
      y += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      (trip.exclusions || []).forEach(item => {
        doc.text(`• ${cleanText(item)}`, 18, y);
        y += 6;
      });

      if (trip.hotelDetails || trip.foodDetails) {
        if (y > 220) {
          doc.addPage();
          y = 20;
        }
        y += 6;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Hotel & Food Details', 14, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        if (trip.hotelDetails) {
          const splitHotel = doc.splitTextToSize(`Hotel: ${cleanText(trip.hotelDetails)}`, 180);
          doc.text(splitHotel, 14, y);
          y += (splitHotel.length * 6) + 4;
        }
        if (trip.foodDetails) {
          const splitFood = doc.splitTextToSize(`Food: ${cleanText(trip.foodDetails)}`, 180);
          doc.text(splitFood, 14, y);
          y += (splitFood.length * 6) + 4;
        }
      }

      if (trip.importantInstructions && trip.importantInstructions.length > 0) {
        if (y > 220) {
          doc.addPage();
          y = 20;
        }
        y += 6;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Important Instructions', 14, y);
        y += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        trip.importantInstructions.forEach(ins => {
          doc.text(`• ${cleanText(ins)}`, 18, y);
          y += 6;
        });
      }

      doc.save(`${cleanText(trip.title).replace(/\s+/g, '_')}_Itinerary.pdf`);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#222222] animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-white pt-20 flex items-center justify-center">
        <div className="text-center">
          <Mountain className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#222222] mb-4">Trip not found</h2>
          <Link to="/trips" className="bg-[#222222] text-white px-6 py-3 rounded-lg font-bold hover:bg-black">Back to Trips</Link>
        </div>
      </div>
    );
  }

  const defaultPickup = (trip.pickupLocations && trip.pickupLocations.length > 0) ? trip.pickupLocations[0] : null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const allDepartureDates = [
    ...(trip.availableDates || []).map(d => ({
      date: d,
      type: 'available',
      pickupLocation: defaultPickup?.location || 'Base Camp',
      address: defaultPickup?.address || trip.location || '',
      time: defaultPickup?.time || (isSaturday(d) ? '10:00 PM' : '6:00 AM')
    })),
    ...(trip.pickupLocations || []).filter(p => p.date).map(p => ({
      date: p.date, type: 'pickup', pickupLocation: p.location, address: p.address, time: p.time || (isSaturday(p.date) ? '10:00 PM' : '6:00 AM')
    }))
  ]
    .filter(item => {
      const d = new Date(item.date);
      return !isNaN(d.getTime()) && d >= now;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const nextDeparture = allDepartureDates.length > 0 ? allDepartureDates[0] : null;

  return (
    <div className="min-h-screen bg-white" id="trip-content-for-pdf">
      <div className="w-full mx-auto px-3 lg:px-6 pt-24 md:pt-28 pb-24">

        {/* Breadcrumbs & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <nav className="flex items-center gap-2 text-sm text-[#717171] font-medium">
            <Link to="/" className="hover:text-[#222222] transition-colors">Home</Link>
            <ChevronRight size={14} />
            <span className="text-[#222222] line-clamp-1">{trip.title}</span>
          </nav>

          <div className="flex gap-4">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-sm font-semibold text-[#222222] hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors underline"
            >
              <Share2 size={16} /> Share
            </button>
          </div>
        </div>

        {/* 2-Column Split Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Left Column - Sticky Image */}
          <div className="lg:w-[45%] xl:w-[42%] flex-shrink-0">
            <div className="sticky top-28 w-full h-[400px] lg:h-[500px] rounded-[32px] overflow-hidden shadow-lg relative group bg-[#f8f9fa] flex items-center justify-center">
              <img
                src={trip.images?.[0] || '/placeholder.jpg'}
                alt={trip.title}
                className="absolute inset-0 w-full h-full object-cover !transform-none"
              />
              {/* Optional blurred backdrop effect if image doesn't perfectly fit */}
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[32px]"></div>

              <button
                onClick={() => setShowGallery(true)}
                className="absolute bottom-5 right-5 bg-white/90 backdrop-blur-md border border-white/20 text-[#222222] font-semibold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-white transition-colors shadow-[0_8px_16px_rgba(0,0,0,0.1)]"
              >
                View All Photos
              </button>
            </div>
          </div>

          {/* Right Column - Content & Tabs */}
          <div className="lg:w-[55%] xl:w-[60%] flex flex-col pt-2">

            {/* Header Info */}
            <div className="mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3" style={{ fontFamily: 'Lato, sans-serif' }}>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-[22px] leading-[1.3] font-black text-[#000000] mb-0.5">{trip.title}</h1>
                <div className="text-[18px] font-black text-[#000000]">₹ {trip.price?.toLocaleString()}</div>
              </div>

              {nextDeparture && (
                <div className="bg-[#f8f9fa] border border-[#e5e5e5] rounded-xl px-4 py-3 flex-shrink-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#444444] mb-0.5">Next upcoming on</p>
                  <p className="text-[14px] font-bold text-[#000000] leading-snug">
                    {new Date(nextDeparture.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} | {nextDeparture.time || (isSaturday(nextDeparture.date) ? '10:00 PM' : '11:00 PM')}
                  </p>
                  {allDepartureDates.length > 1 && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-[13px] text-[#0057ff] underline mt-1 font-bold hover:text-[#0043c2] transition-colors"
                    >
                      Show +{allDepartureDates.length - 1} dates
                    </button>
                  )}
                </div>
              )}
            </div>

            <hr className="my-5 border-[#ebebeb]" />

            {/* Highlights Accordion */}
            <div className="mb-2">
              <button
                onClick={() => setShowHighlights(!showHighlights)}
                className="w-full flex justify-between items-center text-lg font-bold text-[#111] hover:text-gray-700 transition-colors py-2"
              >
                Highlights
                {showHighlights ? <Minus className="w-5 h-5 text-[#717171]" /> : <Plus className="w-5 h-5 text-[#717171]" />}
              </button>
              {showHighlights && trip.highlights && (
                <ul className="mt-4 space-y-3 text-[15px] text-[#111111] font-medium pl-1">
                  {trip.highlights.map((h, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="text-[#F5B301] font-bold mt-0.5">•</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <hr className="my-5 border-[#ebebeb]" />

            {/* Tabs Navigation */}
            <div className="flex items-center gap-3 mb-6 overflow-x-auto no-scrollbar py-1">
              {['About', 'Itinerary', 'Pricing', 'Hotels & Food', 'Inclusions', 'Important Info'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-full text-[14px] font-extrabold transition-all duration-200 whitespace-nowrap border ${activeTab === tab
                      ? 'bg-gradient-to-r from-[#1A365D] to-[#2A4365] text-white border-[#1e3a8a] shadow-[0_4px_14px_rgba(26,54,93,0.35)] scale-[1.03]'
                      : 'bg-[#1A365D]/8 text-[#1A365D] border-[#1A365D]/15 hover:bg-[#1A365D]/15 hover:text-[#0f172a]'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tabs Content Area */}
            <div className="min-h-[400px]">

              {/* === ABOUT TAB === */}
              {activeTab === 'About' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="text-[#111111] text-[15px] leading-[1.8] whitespace-pre-line font-medium">
                    {trip.description}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#f9f9f9] p-6 rounded-2xl border border-[#ebebeb]">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#717171] mt-0.5" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#717171]">Location</p>
                        <p className="text-[14px] font-medium text-[#111]">{trip.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-[#717171] mt-0.5" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#717171]">Duration</p>
                        <p className="text-[14px] font-medium text-[#111]">{trip.days || (trip.nights || 0) + 1} Days / {trip.nights || 0} Nights</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-[#717171] mt-0.5" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#717171]">Min Group</p>
                        <p className="text-[14px] font-medium text-[#111]">{trip.maxGroupSize} Guests</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mountain className="w-5 h-5 text-[#717171] mt-0.5" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#717171]">Category</p>
                        <p className="text-[14px] font-medium text-[#111]">{trip.categoryName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === ITINERARY TAB === */}
              {activeTab === 'Itinerary' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {trip.itinerary?.length > 0 ? (
                    <div className="relative border-l-2 border-[#ebebeb] ml-3 space-y-6 py-2">
                      {trip.itinerary.map((day, i) => (
                        <div key={i} className="relative pl-8">
                          {/* Timeline Dot */}
                          <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-[3px] border-[#222222] shadow-sm" />
                          <h3 className="text-lg font-bold text-[#111] mb-2">
                            Day {day.day}: {day.title}
                          </h3>
                          <p className="text-[#111111] font-medium leading-relaxed text-[15px] whitespace-pre-line">
                            {formatItineraryText(day.description)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#717171] font-light">No itinerary provided.</p>
                  )}
                </div>
              )}

              {/* === PRICING TAB === */}
              {activeTab === 'Pricing' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">

                  {/* "Ticket prices" heading */}
                  <p className="text-[15px] font-bold text-[#111111] mb-4">Ticket prices</p>

                  {/* Price rows */}
                  <div className="divide-y divide-[#f0f0f0]">
                    {(trip.pickupLocations?.length > 0
                      ? trip.pickupLocations
                      : [{ location: trip.title || 'Standard Package', price: trip.price }]
                    ).map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-4 py-3.5">
                        {/* Ticket icon + label */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Ticket SVG icon — matches reference */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#9ca3af"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ width: 28, height: 28, flexShrink: 0 }}
                          >
                            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                            <path d="M13 5v2M13 17v2M13 11v2" />
                          </svg>
                          <span className="text-[14px] font-medium text-[#111111] leading-snug">
                            {item.location || item.name || `Option ${i + 1}`}
                          </span>
                        </div>
                        {/* Price right-aligned */}
                        <span className="text-[15px] font-bold text-[#111111] whitespace-nowrap flex-shrink-0">
                          ₹ {(item.price ?? trip.price)?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Available Departure Dates grid */}
                  <div className="mt-8 pt-6 border-t border-[#ebebeb]">
                    <p className="text-[15px] font-bold text-[#111111] mb-4">Available Departure Dates</p>
                    {allDepartureDates.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allDepartureDates.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => navigate(`/booking/${id}?date=${item.date}`)}
                            className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                              <div>
                                <span className="block text-sm font-bold text-gray-900">
                                  {new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="block text-[11px] text-gray-500 font-medium">{item.time} | {item.pickupLocation}</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-blue-600 group-hover:underline">Book &rarr;</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No upcoming dates scheduled at the moment.</p>
                    )}
                  </div>

                  {/* "All Dates & Prices" pill button */}
                  <div className="mt-8 flex flex-col items-center gap-2">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-8 py-3 rounded-full border-2 border-[#111111] text-[#111111] font-bold text-[15px] hover:bg-[#f9fafb] transition-colors"
                    >
                      All Dates &amp; Prices
                    </button>
                    <p className="text-[12px] text-[#717171]">*Prices may vary depending on dates</p>
                  </div>

                  {/* Cancellation policy (below) */}
                  {trip.cancellationPolicy?.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-[#ebebeb]">
                      <h3 className="text-[15px] font-bold text-[#111] mb-3">Cancellation Policy</h3>
                      <ul className="space-y-2">
                        {trip.cancellationPolicy.map((policy, i) => (
                          <li key={i} className="text-[#111111] font-medium text-[14px] flex items-start gap-3">
                            <span className="text-[#717171] mt-1">•</span> {policy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* === INCLUSIONS TAB === */}
              {activeTab === 'Inclusions' && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* ── What's Included ── */}
                    <div>
                      {/* Header — green circle check + bold label */}
                      <h3 className="font-bold text-[16px] text-[#111] mb-4 flex items-center gap-3">
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Check className="w-4 h-4 text-green-500" strokeWidth={2.5} />
                        </div>
                        What's Included
                      </h3>

                      {/* Items — each with a green ✓ icon */}
                      {(trip.inclusions || []).length > 0 ? (
                        <ul className="space-y-3">
                          {(trip.inclusions || []).map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-[14px] text-[#111111] font-medium leading-snug">
                              <span style={{
                                width: '20px', height: '20px', borderRadius: '50%',
                                background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, marginTop: '1px',
                              }}>
                                <Check style={{ width: 11, height: 11, color: '#16a34a', strokeWidth: 3 }} />
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#9ca3af] text-[14px]">No inclusions listed.</p>
                      )}
                    </div>

                    {/* ── Not Included ── */}
                    <div>
                      {/* Header — red circle X + bold label */}
                      <h3 className="font-bold text-[16px] text-[#111] mb-4 flex items-center gap-3">
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: '#fff1f2', border: '1.5px solid #fecdd3',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <X className="w-4 h-4 text-red-400" strokeWidth={2.5} />
                        </div>
                        Not Included
                      </h3>

                      {/* Items — each with a red ✗ icon */}
                      {(trip.exclusions || []).length > 0 ? (
                        <ul className="space-y-3">
                          {(trip.exclusions || []).map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-[14px] text-[#111111] font-medium leading-snug">
                              <span style={{
                                width: '20px', height: '20px', borderRadius: '50%',
                                background: '#fff1f2', border: '1.5px solid #fecdd3',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, marginTop: '1px',
                              }}>
                                <X style={{ width: 11, height: 11, color: '#ef4444', strokeWidth: 3 }} />
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[#9ca3af] text-[14px]">No exclusions listed.</p>
                      )}
                    </div>
                  </div>

                  {/* Things to carry */}
                  {trip.thingsToCarry?.length > 0 && (
                    <div className="pt-6 border-t border-[#ebebeb]">
                      <h3 className="font-bold text-[16px] text-[#111] mb-4">Things to Carry</h3>
                      <div className="flex flex-wrap gap-2.5">
                        {trip.thingsToCarry.map((item, i) => (
                          <span key={i} className="px-4 py-2 bg-[#f8f9fa] text-[#111111] font-bold text-[13px] rounded-xl border border-[#e5e5e5]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* === HOTELS & FOOD TAB === */}
              {activeTab === 'Hotels & Food' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {trip.hotelDetails ? (
                    <div className="bg-[#f9f9f9] p-6 rounded-2xl border border-[#ebebeb]">
                      <h4 className="font-bold text-gray-900 text-[16px] mb-3">Hotel & Lodging Details</h4>
                      <p className="text-gray-755 text-sm leading-relaxed whitespace-pre-line font-medium">{trip.hotelDetails}</p>
                    </div>
                  ) : null}
                  {trip.foodDetails ? (
                    <div className="bg-[#f9f9f9] p-6 rounded-2xl border border-[#ebebeb]">
                      <h4 className="font-bold text-gray-900 text-[16px] mb-3">Food & Catering Details</h4>
                      <p className="text-gray-755 text-sm leading-relaxed whitespace-pre-line font-medium">{trip.foodDetails}</p>
                    </div>
                  ) : null}
                  {!trip.hotelDetails && !trip.foodDetails && (
                    <p className="text-gray-500 text-sm italic py-4">No lodging or food details provided for this package.</p>
                  )}
                </div>
              )}

              {/* === IMPORTANT INFO TAB === */}
              {activeTab === 'Important Info' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {trip.placesCovered && trip.placesCovered.length > 0 && (
                    <div className="bg-[#f9f9f9] p-6 rounded-2xl border border-[#ebebeb]">
                      <h4 className="font-bold text-[#1A365D] text-[15px] mb-3 uppercase tracking-wider">Places Covered</h4>
                      <div className="flex flex-wrap gap-2.5">
                        {trip.placesCovered.map((place, i) => (
                          <span key={i} className="px-3.5 py-2 bg-white border border-[#ebebeb] rounded-xl text-xs font-bold text-gray-800 shadow-3xs">
                            📍 {place}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {trip.importantInstructions && trip.importantInstructions.length > 0 && (
                    <div className="bg-[#f9f9f9] p-6 rounded-2xl border border-[#ebebeb]">
                      <h4 className="font-bold text-[#1A365D] text-[15px] mb-3 uppercase tracking-wider">Important Instructions</h4>
                      <ul className="space-y-2.5 pl-1">
                        {trip.importantInstructions.map((ins, i) => (
                          <li key={i} className="text-gray-850 font-medium text-[14px] flex items-start gap-2.5">
                            <span className="text-[#f43f5e] font-extrabold mt-0.5">•</span>
                            <span>{ins}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {trip.rules && trip.rules.length > 0 && (
                    <div className="bg-[#f9f9f9] p-6 rounded-2xl border border-[#ebebeb]">
                      <h4 className="font-bold text-[#1A365D] text-[15px] mb-3 uppercase tracking-wider">Trip Rules</h4>
                      <ul className="space-y-2.5 pl-1">
                        {trip.rules.map((rule, i) => (
                          <li key={i} className="text-gray-850 font-medium text-[14px] flex items-start gap-2.5">
                            <span className="text-[#f59e0b] font-extrabold mt-0.5">•</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!trip.placesCovered?.length && !trip.importantInstructions?.length && !trip.rules?.length && (
                    <p className="text-gray-500 text-sm italic py-4">No additional instructions or rules specified.</p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>



      </div>

      {/* Full Screen Photo Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-white z-[100] overflow-y-auto animate-in fade-in duration-300">
          <div className="sticky top-0 left-0 right-0 bg-white/95 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10 border-b border-[#eeeeee] shadow-sm">
            <button onClick={() => setShowGallery(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2 font-bold text-[#111]">
              <ChevronLeft size={24} className="text-[#111]" /> Close Gallery
            </button>
            <button onClick={handleShare} className="flex items-center gap-2 text-sm font-bold text-[#111] hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors">
              <Share2 size={16} /> Share
            </button>
          </div>

          <div className="max-w-[800px] mx-auto px-4 py-10 space-y-8">
            {trip.images?.map((img, i) => (
              <img key={i} src={img} className="w-full object-cover rounded-2xl shadow-sm border border-[#ebebeb]" alt={`Trip view ${i + 1}`} />
            ))}
          </div>
        </div>
      )}

      {/* All Dates Modal */}
      <AllDatesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        trip={trip}
      />

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSubmit={handleLeadSubmit}
        tripTitle={trip?.title}
      />

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#ebebeb] p-3 px-6 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40 flex items-center justify-end gap-4" data-html2canvas-ignore>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 border border-[#d0d0d0] rounded-lg text-[#111] font-bold text-[15px] hover:bg-gray-50 transition-colors"
        >
          PDF <Download size={16} strokeWidth={2.5} />
        </button>
        <button
          onClick={handleBooking}
          className="bg-[#10b981] hover:bg-[#059669] text-white px-8 py-2.5 rounded-lg font-bold text-[15px] transition-colors shadow-sm"
        >
          Book Now
        </button>
      </div>

    </div>
  );
};

export default TripDetail;
