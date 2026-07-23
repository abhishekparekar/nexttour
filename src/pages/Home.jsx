import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Mountain, Compass, MapPin, Calendar } from 'lucide-react';
import TripCard from '../components/TripCard';
import { useCachedTrips, useCachedCategories } from '../firebaseCache';
import { motion, AnimatePresence } from 'framer-motion';
import heroBg1 from '../assest/img/herobg1.png';
import heroBg2 from '../assest/img/herobg2.jpg';

const extractEmoji = (str) => {
  const match = str.match(/^([\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])\s*/);
  if (match) {
    return { emoji: match[1], cleanTitle: str.slice(match[0].length).trim() };
  }
  return { emoji: null, cleanTitle: str };
};

const Home = () => {
  const [trips, setTrips] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  const HERO_IMAGES = [
    heroBg1,
    heroBg2
  ];

  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    let isDeleting = false;
    let textIdx = 0;
    let timeoutId = null;

    const handleType = () => {
      const fullText = 'India';
      if (!isDeleting) {
        setTypedText(fullText.substring(0, textIdx + 1));
        textIdx++;

        if (textIdx === fullText.length) {
          isDeleting = true;
          timeoutId = setTimeout(handleType, 2000); // pause on complete
        } else {
          timeoutId = setTimeout(handleType, 180); // typing speed
        }
      } else {
        setTypedText(fullText.substring(0, textIdx - 1));
        textIdx--;

        if (textIdx === 0) {
          isDeleting = false;
          timeoutId = setTimeout(handleType, 800); // pause on empty
        } else {
          timeoutId = setTimeout(handleType, 80); // deleting speed
        }
      }
    };

    handleType();
    return () => clearTimeout(timeoutId);
  }, []);

  const [typedTagline, setTypedTagline] = useState('');

  useEffect(() => {
    const fullTagline = "Your Dream Travel Partner — Crafting Unforgettable Journeys & Premium Tours Adventures";
    let index = 0;
    let timerId = null;

    const typeTagline = () => {
      if (index < fullTagline.length) {
        setTypedTagline(fullTagline.substring(0, index + 1));
        index++;
        timerId = setTimeout(typeTagline, 25);
      }
    };

    const startTimeout = setTimeout(typeTagline, 1000);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    if (HERO_IMAGES.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [HERO_IMAGES.length]);

  const selectedCategory = searchParams.get('category') || 'all';
  const setCategory = (c) => setSearchParams(p => { const n = new URLSearchParams(p); c === 'all' ? n.delete('category') : n.set('category', c); return n; });

  useEffect(() => {
    const unsubscribeTrips = useCachedTrips((data) => {
      setTrips(data);
      setLoading(false);
    });
    const unsubscribeCategories = useCachedCategories((data) => {
      const allCat = [{
        id: 'all',
        title: 'All',
        icon: Compass,
        image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&q=80'
      }];

      const mappedCats = data.map(cat => {
        const titleText = (cat.name || cat.title || '').toLowerCase();
        let localImage = null;
        let finalTitle = cat.name || cat.title;

        if (titleText.includes('waterfall') || titleText.includes('monsoon')) {
          localImage = '/waterfall.png';
          finalTitle = 'Monsoon Treks';
        }
        else if (titleText.includes('trek')) localImage = '/trek.png';
        else if (titleText.includes('beach')) localImage = '/beach.png';
        else if (titleText.includes('backpack')) localImage = '/backpack.png';

        return {
          id: cat.id,
          title: finalTitle,
          image: localImage || cat.image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80',
          icon: Mountain
        };
      });

      const monsoonCat = mappedCats.find(c => c.title === 'Monsoon Treks');
      const otherCats = mappedCats.filter(c => c.title !== 'Monsoon Treks');

      const finalCats = [...allCat];
      if (monsoonCat) {
        finalCats.push(monsoonCat);
      }
      finalCats.push(...otherCats);
      setCategories(finalCats);
    });
    return () => { unsubscribeTrips(); unsubscribeCategories(); };
  }, []);

  const getNextDate = (trip) => {
    const dates = [
      ...(trip.availableDates || []),
      ...(trip.pickupLocations || []).filter(p => p.date).map(p => p.date)
    ];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const validDates = [...new Set(dates)]
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()) && d >= now)
      .sort((a, b) => a - b);
    return validDates.length > 0 ? validDates[0] : null;
  };

  const upcomingTrips = trips
    .filter(trip => !!trip.upcoming && trip.upcoming !== 'false')
    .map(trip => ({ ...trip, nextDate: getNextDate(trip) }))
    .sort((a, b) => {
      if (!a.nextDate) return 1;
      if (!b.nextDate) return -1;
      return a.nextDate - b.nextDate;
    });

  const filteredTrips = trips.filter(trip => {
    if (selectedCategory === 'all') return true;
    
    const targetCat = categories.find(c => String(c.id) === String(selectedCategory));
    const targetTitle = (targetCat?.title || targetCat?.name || '').toLowerCase();
    
    const tripCatId = String(trip.categoryId || '').toLowerCase();
    const tripCatName = String(trip.categoryName || '').toLowerCase();
    const selCatId = String(selectedCategory).toLowerCase();

    return (
      tripCatId === selCatId ||
      tripCatName === selCatId ||
      (targetTitle && (tripCatId === targetTitle || tripCatName === targetTitle))
    );
  });

  const heroContentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.15
      }
    }
  };

  const heroItemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#D2E823]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-0 md:pt-0">
      <style>{`
        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #00C9B7; }
        }
        .typing-cursor {
          border-right: 4px solid #00C9B7;
          animation: blink-caret 0.75s step-end infinite;
        }
      `}</style>

      {/* Hero Section - Full Bleed Viewport Fit */}
      <div className="relative w-full min-h-[520px] h-[80vh] lg:h-[86vh] max-h-[760px] bg-[#0d1117] overflow-hidden flex items-center justify-center pt-16 md:pt-20 select-none">
        {/* Background Images Slider - Seamless Cross-Fade + Ken Burns Effect */}
        <AnimatePresence initial={false}>
          <motion.img
            key={currentHeroIdx}
            src={HERO_IMAGES[currentHeroIdx]}
            alt="NextTour Hero Background"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 0.75, scale: 1.08 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.6, ease: "easeInOut" },
              scale: { duration: 5.5, ease: "easeOut" }
            }}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </AnimatePresence>

        {/* Premium dark gradient overlay for crystal clear text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/30 to-black/85 pointer-events-none" />

        {/* Slide Indicator Dots */}
        {HERO_IMAGES.length > 1 && (
          <div className="absolute bottom-5 z-20 flex items-center gap-2">
            {HERO_IMAGES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentHeroIdx(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-500 ${
                  currentHeroIdx === idx
                    ? 'w-8 bg-[#00C9B7] shadow-[0_0_10px_#00C9B7]'
                    : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}

        {/* Hero Content */}
        <motion.div
          variants={heroContentVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center text-white px-4 sm:px-6 max-w-5xl flex flex-col items-center py-6"
        >
          {/* Badge indicator */}
          <motion.div
            variants={heroItemVariants}
            whileHover={{ scale: 1.05 }}
            className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/25 text-xs sm:text-sm font-bold tracking-wider text-[#00C9B7] shadow-lg select-none cursor-default"
          >
            🏔️ Premium Trekking &amp; Adventures
          </motion.div>

          {/* Heading - NextTour */}
          <motion.h1
            variants={heroItemVariants}
            className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-4 tracking-tight leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] flex flex-wrap justify-center gap-x-2 sm:gap-x-4"
            style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}
          >
            <span className="inline-block overflow-hidden py-1">
              <motion.span
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block text-white"
              >
                Next
              </motion.span>
            </span>
            <span className="inline-block overflow-hidden py-1">
              <motion.span
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.0, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block text-[#00C9B7] drop-shadow-[0_0_35px_rgba(0,201,183,0.8)] typing-cursor pr-2"
              >
                Tour
              </motion.span>
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            variants={heroItemVariants}
            className="text-base sm:text-lg md:text-xl font-medium tracking-wide text-gray-200 max-w-3xl mx-auto leading-relaxed drop-shadow-lg min-h-[2.5em]"
          >
            {typedTagline}
          </motion.p>
        </motion.div>
      </div>

      {/* Category Filter Bar */}
      <div className="bg-white border-b border-gray-200 mb-8 pb-6 shadow-2xs">
        <div className="w-full max-w-[2400px] mx-auto px-4 sm:px-8 xl:px-12">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pt-5 pb-2">
            {categories.map((cat) => {
              const { cleanTitle } = extractEmoji(cat.title);
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`group relative flex-shrink-0 rounded-2xl h-[64px] min-w-[135px] px-5 flex items-center justify-center transition-all duration-300 border-2 transform-gpu ${isSelected
                    ? 'border-[#00C9B7] shadow-md scale-[0.98]'
                    : 'border-transparent hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                >
                  {/* Inner clipping container to prevent corner bleeding on hover */}
                  <div
                    className="absolute inset-0 rounded-xl overflow-hidden"
                    style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)', isolation: 'isolate' }}
                  >
                    {/* Photo Background */}
                    <img
                      src={cat.image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 bg-gray-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80';
                      }}
                    />

                    {/* Overlay */}
                    <div className={`absolute inset-0 transition-colors duration-300 ${isSelected
                      ? 'bg-black/65'
                      : 'bg-black/40 group-hover:bg-black/50 backdrop-blur-[0.5px]'
                      }`} />
                  </div>

                  {/* Icon & Title */}
                  <div className="relative z-10 flex items-center gap-2">
                    {cat.id === 'all' && <Compass className="w-4 h-4 text-[#00C9B7] drop-shadow-md" strokeWidth={2.5} />}
                    <span className={`font-bold text-sm tracking-wide drop-shadow-md ${isSelected ? 'text-[#00C9B7]' : 'text-white'}`}>
                      {cleanTitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ongoing Trips Section */}
      {/* Upcoming Trips */}
      {upcomingTrips.length > 0 && (
        <div className="w-full max-w-[2400px] mx-auto px-4 sm:px-6 xl:px-10 pb-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
                Upcoming Trips
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
                Secure your spot on our next upcoming scheduled group tours
              </p>
            </div>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 md:gap-5">
            {upcomingTrips.map((trip, index) => (
              <motion.div
                key={`upcoming-${trip.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="w-[280px] sm:w-auto flex-shrink-0"
              >
                <TripCard trip={trip} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Ongoing Trips Grid - Compact Spacing */}
      <div id="trips-grid" className={`w-full max-w-[2400px] mx-auto px-4 sm:px-6 xl:px-10 pb-12 ${upcomingTrips.length > 0 ? 'border-t border-gray-100 pt-6' : 'pt-4'}`}>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900" style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
              Ongoing Trips
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5 font-medium">
              Explore our ongoing adventures and scheduled tours
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 md:gap-5">
          {filteredTrips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-30px" }}
              transition={{ duration: 0.4, delay: (index % 4) * 0.06, ease: "easeOut" }}
            >
              <TripCard trip={trip} />
            </motion.div>
          ))}
        </div>

        {filteredTrips.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 shadow-sm max-w-lg mx-auto">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No trips found</h3>
            <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto">
              We couldn't find any trips in this category right now. Check back later or explore other categories.
            </p>
            <button
              onClick={() => setCategory('all')}
              className="mt-5 bg-[#00C9B7] text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold hover:bg-[#00b5a3] transition-colors shadow-md"
            >
              View All Trips
            </button>
          </div>
        )}
      </div>


      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/919970280549"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[100] bg-[#25D366] text-white p-3 md:p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        title="Chat with us on WhatsApp"
      >
        {/* WhatsApp SVG Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7 md:w-8 md:h-8"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
};

export default Home;
