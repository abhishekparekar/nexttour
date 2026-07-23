import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, Star, Shield, ArrowRight, Calendar, X, Share2,
  ChevronRight, ChevronLeft, Loader2, Mountain, ChevronDown,
  ChevronUp, Check, Plus, Minus, Users, Download, AlertCircle,
  Utensils, Hotel, Info, Package, List, Compass
} from 'lucide-react';
import { getTripById, getTrips, saveLead } from '../firebase';
import AllDatesModal from '../components/AllDatesModal';
import LeadCaptureModal from '../components/LeadCaptureModal';

const isSaturday = (dateStr) => {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return d.getDay() === 6;
};

const TABS = ['About', 'Itinerary', 'Inclusions', 'Hotels & Food', 'Important Info', 'Pricing'];

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState(null);
  const [relatedTrips, setRelatedTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('About');
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [selectedTrekkers, setSelectedTrekkers] = useState(1);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const data = await getTripById(id);
        if (data) setTrip(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTrip();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!trip) return;
    const fetchRelated = async () => {
      try {
        const all = await getTrips();
        const filtered = all.filter(t => t.id !== trip.id);
        const same = filtered.filter(t => t.categoryId === trip.categoryId || t.categoryName === trip.categoryName);
        const other = filtered.filter(t => t.categoryId !== trip.categoryId && t.categoryName !== trip.categoryName);
        setRelatedTrips([...same.slice(0, 3), ...other.slice(0, 3)].slice(0, 4));
      } catch (e) {
        console.error(e);
      }
    };
    fetchRelated();
  }, [trip]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: trip?.title, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  const handleBooking = () => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const dates = [
      ...(trip?.availableDates || []).map(d => ({ date: d })),
      ...(trip?.pickupLocations || []).filter(p => p.date).map(p => ({ date: p.date }))
    ].filter(i => { const d = new Date(i.date); return !isNaN(d) && d >= now; })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const next = dates[0]?.date || '';
    navigate(`/booking/${id}${next ? `?date=${next}` : ''}`);
  };

  const handleLeadSubmit = async ({ name, phone, city }) => {
    await saveLead(phone, { name, city, lastDownloadedTripId: id, lastDownloadedTripTitle: trip.title });
    executeDownloadPDF();
  };

  const executeDownloadPDF = () => {
    const clean = (t) => {
      if (!t) return '';
      return t.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').replace(/[\u2600-\u27BF]/g, '').replace(/[\uE000-\uF8FF]/g, '').trim();
    };
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 20;
      doc.setFontSize(22); doc.setFont('helvetica', 'bold');
      doc.text(clean(trip.title), 14, y); y += 10;
      doc.setFontSize(16); doc.setTextColor(0, 128, 0);
      doc.text(`Price: Rs. ${trip.price}`, 14, y); y += 15;
      if (trip.highlights?.length) {
        doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.text('Highlights', 14, y); y += 8;
        doc.setFontSize(11); doc.setFont('helvetica', 'normal');
        trip.highlights.forEach(h => { doc.text(`• ${clean(h)}`, 18, y); y += 6; });
        y += 5;
      }
      if (trip.description) {
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('About', 14, y); y += 8;
        doc.setFontSize(11); doc.setFont('helvetica', 'normal');
        const split = doc.splitTextToSize(clean(trip.description), 180);
        doc.text(split, 14, y); y += split.length * 6 + 10;
      }
      if (y > 250) { doc.addPage(); y = 20; }
      if (trip.itinerary?.length) {
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('Itinerary', 14, y); y += 8;
        trip.itinerary.forEach(day => {
          doc.setFont('helvetica', 'bold');
          doc.text(`Day ${day.day}: ${clean(day.title)}`, 14, y); y += 6;
          doc.setFont('helvetica', 'normal');
          const s = doc.splitTextToSize(clean(day.description || ''), 180);
          doc.text(s, 14, y); y += s.length * 6 + 6;
          if (y > 260) { doc.addPage(); y = 20; }
        });
      }
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('Inclusions', 14, y); y += 8;
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      (trip.inclusions || []).forEach(i => { doc.text(`• ${clean(i)}`, 18, y); y += 6; });
      y += 10;
      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('Exclusions', 14, y); y += 8;
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      (trip.exclusions || []).forEach(i => { doc.text(`• ${clean(i)}`, 18, y); y += 6; });
      doc.save(`${clean(trip.title).replace(/\s+/g, '_')}_Itinerary.pdf`);
    });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-[#00C9B7] animate-spin" />
        <p className="text-gray-500 font-semibold text-sm">Loading trip details...</p>
      </div>
    </div>
  );

  if (!trip) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-4">
        <Mountain className="w-20 h-20 text-gray-200 mx-auto mb-5" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Trip not found</h2>
        <p className="text-gray-500 mb-6">This trip may have been removed or doesn't exist.</p>
        <Link to="/trips" className="inline-flex items-center gap-2 bg-[#00C9B7] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#00b3a3] transition-all">
          <ArrowRight size={16} /> Browse All Trips
        </Link>
      </div>
    </div>
  );

  // --- Computed values ---
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const defaultPickup = trip.pickupLocations?.[0] || null;

  const allDepartureDates = [
    ...(trip.availableDates || []).map(d => ({
      date: d, type: 'available',
      pickupLocation: defaultPickup?.location || 'Base Camp',
      address: defaultPickup?.address || trip.location || '',
      time: defaultPickup?.time || (isSaturday(d) ? '10:00 PM' : '6:00 AM')
    })),
    ...(trip.pickupLocations || []).filter(p => p.date).map(p => ({
      date: p.date, type: 'pickup', pickupLocation: p.location,
      address: p.address, time: p.time || (isSaturday(p.date) ? '10:00 PM' : '6:00 AM')
    }))
  ].filter(i => { const d = new Date(i.date); return !isNaN(d) && d >= now; })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const nextDeparture = allDepartureDates[0] || null;
  const totalPrice = (trip.price || 0) * selectedTrekkers;
  const hasHighlights = trip.highlights?.length > 0;
  const mainImage = trip.images?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80';

  return (
    <div className="min-h-screen bg-[#F7F8FA] pt-[70px] sm:pt-[80px]">
      {/* Main container */}
      <div className="max-w-6xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 pb-28">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold mb-4">
          <Link to="/" className="hover:text-[#00C9B7] transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/trips" className="hover:text-[#00C9B7] transition-colors">Trips</Link>
          <ChevronRight size={12} />
          <span className="text-gray-700 truncate max-w-[160px] sm:max-w-xs">{trip.title}</span>
        </nav>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-8 lg:items-start">
          {/* Left Column – Image card & Desktop Booking */}
          <div className="w-full lg:w-[400px] xl:w-[440px] flex-shrink-0">
            {/* Square image card */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-200 shadow-md group">
              <img
                src={mainImage}
                alt={trip.title}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

              {/* Category badge */}
              {trip.categoryName && (
                <span className="absolute top-3 left-3 bg-[#00C9B7] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                  {trip.categoryName}
                </span>
              )}

              {/* Gallery button */}
              {trip.images?.length > 1 && (
                <button
                  onClick={() => { setGalleryIndex(0); setShowGallery(true); }}
                  className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md hover:bg-white transition-colors"
                >
                  <Package size={13} /> {trip.images.length} Photos
                </button>
              )}

              {/* Share button */}
              <button
                onClick={handleShare}
                className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md hover:bg-white transition-colors"
              >
                <Share2 size={13} /> Share
              </button>
            </div>

            {/* Thumbnail strip */}
            {trip.images?.length > 1 && (
              <div className="flex gap-2 mt-2.5 overflow-x-auto no-scrollbar">
                {trip.images.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setGalleryIndex(i); setShowGallery(true); }}
                    className="w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] flex-shrink-0 rounded-xl overflow-hidden border-2 border-transparent hover:border-[#00C9B7] transition-all"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {trip.images.length > 4 && (
                  <button
                    onClick={() => { setGalleryIndex(0); setShowGallery(true); }}
                    className="w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] flex-shrink-0 rounded-xl bg-gray-800 flex items-center justify-center text-white text-xs font-bold hover:bg-gray-700 transition-colors"
                  >
                    +{trip.images.length - 4}
                  </button>
                )}
              </div>
            )}

            {/* Desktop Booking Card */}
            <div className="hidden lg:block mt-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 sticky top-24">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Starting From</p>
                <div className="text-3xl font-black text-gray-900 mb-0.5">₹{trip.price?.toLocaleString('en-IN')}</div>
                <p className="text-xs text-gray-400 font-semibold mb-4">per person</p>

                <div className="flex items-center justify-between mb-4 py-3 border-y border-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Trekkers</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedTrekkers(v => Math.max(1, v - 1))} className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50">
                      <Minus size={13} />
                    </button>
                    <span className="text-sm font-black w-5 text-center">{selectedTrekkers}</span>
                    <button onClick={() => setSelectedTrekkers(v => v + 1)} className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50">
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-gray-600">Total</span>
                  <span className="text-xl font-black text-[#00C9B7]">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>

                <button onClick={handleBooking} className="w-full bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-black py-3.5 rounded-xl transition-all shadow-md text-sm mb-2.5">
                  Book Now
                </button>
                <button onClick={() => setIsLeadModalOpen(true)} className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
                  <Download size={15} /> Download PDF
                </button>

                {nextDeparture && (
                  <div className="mt-4 bg-[#f0fdfb] border border-[#b2f0ea] rounded-xl p-3">
                    <p className="text-[10px] font-bold uppercase text-[#00b3a3] mb-0.5">Next Departure</p>
                    <p className="text-xs font-bold text-gray-800">
                      {new Date(nextDeparture.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500">{nextDeparture.time} • {nextDeparture.pickupLocation}</p>
                    {allDepartureDates.length > 1 && (
                      <button onClick={() => setIsModalOpen(true)} className="text-[11px] text-[#0057ff] underline mt-1 font-bold">+{allDepartureDates.length - 1} more dates</button>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <Shield size={13} className="text-[#00C9B7] flex-shrink-0" />
                  <span>Secure booking • No hidden charges</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column – Content */}
          <div className="flex-1 min-w-0">
            {/* Title & Price */}
            <div className="mb-4">
              <h1 className="text-xl sm:text-2xl lg:text-[26px] font-black text-gray-900 leading-tight mb-1.5">{trip.title}</h1>
              <div className="flex flex-wrap items-center gap-2.5 text-gray-500 text-xs sm:text-sm font-semibold mb-2">
                {trip.location && <span className="flex items-center gap-1"><MapPin size={12} /> {trip.location}</span>}
                {(trip.days || trip.nights) && <span className="flex items-center gap-1"><Clock size={12} /> {trip.days || (trip.nights + 1)}D / {trip.nights || 0}N</span>}
                {trip.difficulty && <span className="flex items-center gap-1"><Compass size={12} /> {trip.difficulty}</span>}
                {trip.rating > 0 && <span className="flex items-center gap-1"><Star size={12} fill="#facc15" stroke="none" /> {trip.rating.toFixed(1)}</span>}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">₹{trip.price?.toLocaleString('en-IN')}</span>
                <span className="text-sm text-gray-400 font-semibold">/ person</span>
              </div>
            </div>

            {/* Mobile next departure */}
            {nextDeparture && (
              <div className="lg:hidden bg-[#f0fdfb] border border-[#b2f0ea] rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-[#00b3a3] mb-0.5">Next Departure</p>
                  <p className="text-sm font-bold text-gray-900">{new Date(nextDeparture.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs text-gray-500">{nextDeparture.time} • {nextDeparture.pickupLocation}</p>
                </div>
                {allDepartureDates.length > 1 && (
                  <button onClick={() => setIsModalOpen(true)} className="text-xs text-[#0057ff] font-bold underline">+{allDepartureDates.length - 1} more</button>
                )}
              </div>
            )}

            {/* Trip Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              {[
                { icon: <Clock size={17} className="text-[#00C9B7]" />, label: 'Duration', value: `${trip.days || (trip.nights + 1) || '—'}D / ${trip.nights || 0}N` },
                { icon: <Compass size={17} className="text-[#00C9B7]" />, label: 'Difficulty', value: trip.difficulty || 'Moderate' },
                { icon: <Users size={17} className="text-[#00C9B7]" />, label: 'Group Size', value: `${trip.maxGroupSize || '—'} max` },
                { icon: <Star size={17} fill="#facc15" stroke="none" />, label: 'Rating', value: trip.rating ? `${trip.rating.toFixed(1)} / 5` : 'N/A' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col items-center text-center gap-1 shadow-sm">
                  {icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-800">{value}</span>
                </div>
              ))}
            </div>

            {/* Highlights */}
            {hasHighlights && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
                <button
                  onClick={() => setShowHighlights(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-black text-gray-900 flex items-center gap-2.5 text-sm sm:text-base">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00C9B7] shadow-[0_0_8px_#00C9B7aa]" />
                    Trip Highlights
                    <span className="text-xs text-gray-400 font-semibold">({trip.highlights.length})</span>
                  </span>
                  {showHighlights ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>
                {showHighlights && (
                  <div className="px-5 pb-5">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {trip.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 font-medium leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-[#e6faf8] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check size={11} className="text-[#00C9B7]" strokeWidth={3} />
                          </span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-shrink-0 px-4 sm:px-5 py-3.5 text-xs sm:text-[13px] font-bold transition-all whitespace-nowrap border-b-2 ${
                      activeTab === tab
                        ? 'border-[#00C9B7] text-[#00C9B7] bg-[#f0fdfb]'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4 sm:p-6">
                {/* ABOUT */}
                {activeTab === 'About' && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    {trip.description ? (
                      <p className="text-gray-700 text-sm sm:text-[15px] leading-[1.85] whitespace-pre-line font-medium">
                        {trip.description}
                      </p>
                    ) : (
                      <p className="text-gray-400 text-sm italic">No description provided.</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {[
                        { label: 'Location', value: trip.location, icon: <MapPin size={14} className="text-[#00C9B7]" /> },
                        { label: 'Duration', value: `${trip.days || (trip.nights + 1) || '—'} Days / ${trip.nights || 0} Nights`, icon: <Clock size={14} className="text-[#00C9B7]" /> },
                        { label: 'Group Size', value: `Max ${trip.maxGroupSize || '—'} people`, icon: <Users size={14} className="text-[#00C9B7]" /> },
                        { label: 'Category', value: trip.categoryName, icon: <Compass size={14} className="text-[#00C9B7]" /> },
                        { label: 'Difficulty', value: trip.difficulty, icon: <Shield size={14} className="text-[#00C9B7]" /> },
                        { label: 'Max Altitude', value: trip.maxAltitude, icon: <Mountain size={14} className="text-[#00C9B7]" /> },
                      ].filter(i => i.value).map(({ label, value, icon }) => (
                        <div key={label} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                            {icon}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                            <p className="text-sm font-semibold text-gray-800">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ITINERARY */}
                {activeTab === 'Itinerary' && (
                  <div className="animate-in fade-in duration-300">
                    {trip.itinerary?.length > 0 ? (
                      <div className="space-y-0">
                        {trip.itinerary.map((day, i) => (
                          <div key={i} className="flex gap-4 pb-6 last:pb-0">
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00C9B7] to-[#00a89a] flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-sm">
                                D{day.day}
                              </div>
                              {i < trip.itinerary.length - 1 && (
                                <div className="w-0.5 flex-1 bg-gray-200 mt-2 min-h-[20px]" />
                              )}
                            </div>
                            <div className="flex-1 pt-1 pb-2">
                              <h3 className="text-sm sm:text-base font-black text-gray-900 mb-1.5">
                                Day {day.day}: {day.title}
                              </h3>
                              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line font-medium">
                                {day.description || 'No details provided.'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <List size={40} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm font-medium">No itinerary provided for this trip.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* INCLUSIONS */}
                {activeTab === 'Inclusions' && (
                  <div className="animate-in fade-in duration-300 space-y-6">
                    <div>
                      <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <Check size={13} className="text-green-600" strokeWidth={3} />
                        </span>
                        What's Included
                      </h3>
                      {(trip.inclusions || []).length > 0 ? (
                        <ul className="space-y-2">
                          {trip.inclusions.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                              <span className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check size={10} className="text-green-600" strokeWidth={3} />
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-gray-400 text-sm italic">No inclusions listed.</p>}
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                          <X size={13} className="text-red-500" strokeWidth={3} />
                        </span>
                        Not Included
                      </h3>
                      {(trip.exclusions || []).length > 0 ? (
                        <ul className="space-y-2">
                          {trip.exclusions.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                              <span className="w-5 h-5 rounded-full bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <X size={10} className="text-red-500" strokeWidth={3} />
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-gray-400 text-sm italic">No exclusions listed.</p>}
                    </div>

                    {(trip.thingsToCarry || []).length > 0 && (
                      <div>
                        <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <Package size={13} className="text-blue-600" />
                          </span>
                          Things to Carry
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {trip.thingsToCarry.map((item, i) => (
                            <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 font-semibold text-xs rounded-lg border border-gray-200">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* HOTELS & FOOD */}
                {activeTab === 'Hotels & Food' && (
                  <div className="animate-in fade-in duration-300 space-y-5">
                    {trip.hotelDetails ? (
                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2">
                          <Hotel size={16} className="text-[#00C9B7]" /> Hotel & Lodging Details
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line font-medium">{trip.hotelDetails}</p>
                      </div>
                    ) : null}
                    {trip.foodDetails ? (
                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2">
                          <Utensils size={16} className="text-[#00C9B7]" /> Food & Catering Details
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line font-medium">{trip.foodDetails}</p>
                      </div>
                    ) : null}
                    {!trip.hotelDetails && !trip.foodDetails && (
                      <div className="text-center py-10">
                        <Hotel size={40} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm font-medium">No hotel or food details provided.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* IMPORTANT INFO */}
                {activeTab === 'Important Info' && (
                  <div className="animate-in fade-in duration-300 space-y-5">
                    {(trip.placesCovered || []).length > 0 && (
                      <div>
                        <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2">
                          <MapPin size={15} className="text-[#00C9B7]" /> Places Covered
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {trip.placesCovered.map((p, i) => (
                            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 shadow-sm">
                              📍 {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(trip.importantInstructions || []).length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h4 className="font-black text-amber-900 text-sm mb-3 flex items-center gap-2">
                          <AlertCircle size={15} className="text-amber-600" /> Important Instructions
                        </h4>
                        <ul className="space-y-2">
                          {trip.importantInstructions.map((ins, i) => (
                            <li key={i} className="text-amber-800 text-sm font-medium flex items-start gap-2">
                              <span className="text-amber-500 font-black mt-0.5">•</span>
                              {ins}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(trip.rules || []).length > 0 && (
                      <div>
                        <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2">
                          <Shield size={15} className="text-[#00C9B7]" /> Trip Rules
                        </h4>
                        <ul className="space-y-2">
                          {trip.rules.map((r, i) => (
                            <li key={i} className="text-gray-700 text-sm font-medium flex items-start gap-2">
                              <span className="text-[#f59e0b] font-black mt-0.5">•</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!trip.placesCovered?.length && !trip.importantInstructions?.length && !trip.rules?.length && (
                      <div className="text-center py-10">
                        <Info size={40} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm font-medium">No additional info provided.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* PRICING */}
                {activeTab === 'Pricing' && (
                  <div className="animate-in fade-in duration-300 space-y-6">
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 lg:hidden">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Calculate Total Cost</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">Number of Trekkers</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setSelectedTrekkers(v => Math.max(1, v - 1))}
                            className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-base font-black text-gray-900 w-5 text-center">{selectedTrekkers}</span>
                          <button
                            onClick={() => setSelectedTrekkers(v => v + 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-600">Total ({selectedTrekkers} × ₹{trip.price?.toLocaleString('en-IN')})</span>
                        <span className="text-xl font-black text-[#00C9B7]">₹{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {allDepartureDates.length > 0 && (
                      <div>
                        <p className="text-sm font-black text-gray-900 mb-3">Available Departure Dates</p>
                        <div className="space-y-2.5">
                          {allDepartureDates.slice(0, 5).map((item, idx) => (
                            <div
                              key={idx}
                              onClick={() => navigate(`/booking/${id}?date=${item.date}`)}
                              className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-[#f0fdfb] hover:border-[#00C9B7] transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center group-hover:border-[#00C9B7] transition-colors">
                                  <Calendar size={16} className="text-gray-400 group-hover:text-[#00C9B7] transition-colors" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900">
                                    {new Date(item.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                  </p>
                                  <p className="text-xs text-gray-500">{item.time} • {item.pickupLocation}</p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-[#00C9B7] flex items-center gap-1">
                                Book <ArrowRight size={12} />
                              </span>
                            </div>
                          ))}
                          {allDepartureDates.length > 5 && (
                            <button
                              onClick={() => setIsModalOpen(true)}
                              className="w-full py-3 text-sm font-bold text-[#0057ff] border border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                              View All {allDepartureDates.length} Dates
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {(trip.cancellationPolicy || []).length > 0 && (
                      <div>
                        <p className="text-sm font-black text-gray-900 mb-3">Cancellation Policy</p>
                        <ul className="space-y-2">
                          {trip.cancellationPolicy.map((p, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 font-medium">
                              <span className="text-gray-400 mt-0.5">•</span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Related Trips */}
            {relatedTrips.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base sm:text-lg font-black text-gray-900 mb-4">You May Also Like</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedTrips.map(t => (
                    <Link
                      key={t.id}
                      to={`/trips/${t.id}`}
                      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-[#00C9B7] transition-all duration-200"
                    >
                      <div className="h-[140px] sm:h-[160px] overflow-hidden bg-gray-100">
                        <img
                          src={t.images?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80'}
                          alt={t.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80'; }}
                        />
                      </div>
                      <div className="p-3.5">
                        <p className="font-black text-gray-900 text-sm leading-snug mb-1.5 group-hover:text-[#00C9B7] transition-colors">{t.title}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={11} /> {t.location || 'India'}
                          </span>
                          <span className="text-sm font-black text-[#00C9B7]">₹{t.price?.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <p className="text-white font-bold text-sm">{galleryIndex + 1} / {trip.images.length}</p>
            <button onClick={() => setShowGallery(false)} className="text-white hover:text-gray-300 transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative px-4 py-4">
            <img
              src={trip.images[galleryIndex]}
              alt={`Photo ${galleryIndex + 1}`}
              className="max-h-full max-w-full object-contain rounded-xl"
            />
            {galleryIndex > 0 && (
              <button
                onClick={() => setGalleryIndex(v => v - 1)}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {galleryIndex < trip.images.length - 1 && (
              <button
                onClick={() => setGalleryIndex(v => v + 1)}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
          {trip.images.length > 1 && (
            <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar justify-center">
              {trip.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIndex(i)}
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${galleryIndex === i ? 'border-[#00C9B7]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AllDatesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} trip={trip} />
      <LeadCaptureModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSubmit={handleLeadSubmit}
        tripTitle={trip?.title}
      />

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 font-semibold">From</p>
          <p className="text-lg font-black text-gray-900">₹{trip.price?.toLocaleString('en-IN')}</p>
        </div>
        <button
          onClick={() => setIsLeadModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors"
        >
          <Download size={14} /> PDF
        </button>
        <button
          onClick={handleBooking}
          className="flex-1 bg-[#00C9B7] hover:bg-[#00b3a3] text-white py-2.5 rounded-xl font-black text-sm transition-all shadow-md active:scale-[0.98]"
        >
          Book Now
        </button>
      </div>

    </div>
  );
};

export default TripDetail;
