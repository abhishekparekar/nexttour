import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import AllDatesModal from './AllDatesModal';

const PLACEHOLDER_IMAGE = '/placeholder.jpg';

const TripCard = ({ trip }) => {
  const [imageError, setImageError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { id, title, price, images = [], status } = trip;

  const [imageUrl, setImageUrl] = useState(!imageError && images[0] ? images[0] : PLACEHOLDER_IMAGE);

  useEffect(() => {
    let isMounted = true;
    const loadAndCacheImage = async () => {
      if (imageError || !images[0]) {
        setImageUrl(PLACEHOLDER_IMAGE);
        return;
      }
      const url = images[0];
      
      try {
        if ('caches' in window) {
          const cache = await caches.open('trip-images-cache');
          const cachedResponse = await cache.match(url);
          
          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            if (isMounted) setImageUrl(objectUrl);
            return;
          }
          
          if (isMounted) setImageUrl(url);
          
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response.clone());
          }
        } else {
          if (isMounted) setImageUrl(url);
        }
      } catch (err) {
        if (isMounted) setImageUrl(url);
      }
    };
    
    loadAndCacheImage();
    return () => {
      isMounted = false;
    };
  }, [images, imageError]);

  const allDates = [
    ...(trip.availableDates || []),
    ...(trip.pickupLocations || []).filter(p => p.date).map(p => p.date),
  ];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const allValidDates = [...new Set(allDates)]
    .map(d => new Date(d))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a - b);

  const upcomingDates = allValidDates.filter(d => d >= now);
  const displayDates  = upcomingDates.length > 0 ? upcomingDates : allValidDates;
  const nextDate      = displayDates[0] ?? null;
  const otherDates    = displayDates.slice(1, 4);

  const fmt = (d, opts) => d.toLocaleDateString('en-IN', opts);

  const cleanTitle =
    title?.replace(/^([\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])\s*/, '').trim() ?? title;

  const s = (status || '').toLowerCase().replace(/[\s_-]/g, '');
  const badgeLabel =
    s === 'confirmed' ? 'Confirmed' :
    s === 'toprated'  ? 'Top Rated' :
    s === 'featured'  ? 'Featured'  :
    s === 'soldout'   ? 'Sold Out'  :
    null;
  const badgeBg =
    badgeLabel === 'Sold Out' ? '#dc3545' :
    badgeLabel === 'Featured' ? '#0d6efd' :
    'rgb(40, 167, 69)';

  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="group relative w-full flex flex-col font-sans"
      >
        {/* Image Card Container */}
        <Link
          to={`/trip/${id}`}
          className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 bg-gray-100 block"
        >
          <motion.img
            src={imageUrl}
            alt={cleanTitle}
            onError={() => setImageError(true)}
            loading="lazy"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full h-full object-cover block"
          />

          {/* Status Badge */}
          {badgeLabel && (
            <div 
              className="absolute top-0 right-0 px-3 py-1.5 text-white font-bold text-xs tracking-wider rounded-bl-xl shadow-md z-10 select-none"
              style={{ backgroundColor: badgeBg }}
            >
              {badgeLabel}
            </div>
          )}
        </Link>

        {/* Info Section Below Image */}
        <div className="pt-3 pb-1 flex flex-col">
          <div className="flex gap-2.5 w-full items-start">

            {/* Date Box Holder */}
            {nextDate ? (
              <div className="flex flex-col items-center justify-center flex-shrink-0 border border-gray-200 rounded-xl bg-white min-w-[54px] sm:min-w-[58px] p-2 gap-0.5 shadow-2xs">
                <span className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase leading-none">
                  {fmt(nextDate, { weekday: 'short' })}
                </span>
                <span className="text-xl sm:text-2xl font-black text-gray-900 leading-tight bg-teal-50 text-[#00C9B7] rounded-md px-1.5 py-0.5 my-0.5">
                  {fmt(nextDate, { day: 'numeric' })}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase leading-none">
                  {fmt(nextDate, { month: 'short' })}
                </span>
              </div>
            ) : (
              <div className="w-12 flex-shrink-0" />
            )}

            {/* Right Column: Pills + Title + Price */}
            <div className="flex flex-col flex-1 min-w-0">

              {/* Date Pills & All Dates Button */}
              <div className="flex items-center gap-1.5 mb-1.5 flex-nowrap overflow-hidden">
                <div className="flex items-center gap-1 overflow-hidden">
                  {nextDate && otherDates.map((date, i) => (
                    <div 
                      key={i} 
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-gray-800 bg-gray-100 border border-gray-200 whitespace-nowrap flex-shrink-0"
                    >
                      {fmt(date, { day: 'numeric', month: 'short' })}
                    </div>
                  ))}

                  {!nextDate && (
                    <span className="text-xs text-gray-400 font-medium">No upcoming dates</span>
                  )}
                </div>

                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsModalOpen(true); }}
                  className="inline-flex items-center justify-center whitespace-nowrap h-6 px-2 gap-1 border border-gray-300 rounded-md bg-white text-[11px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-[#00C9B7] transition-all flex-shrink-0 ml-auto"
                >
                  <Calendar className="w-3 h-3 text-[#00C9B7]" strokeWidth={2.5} />
                  <span>Dates</span>
                </button>
              </div>

              {/* Title */}
              <Link to={`/trip/${id}`} className="group-hover:text-[#00C9B7] transition-colors">
                <h3 className="m-0 mb-1 text-sm sm:text-base font-extrabold text-gray-900 leading-tight line-clamp-2 capitalize">
                  {cleanTitle}
                </h3>
              </Link>

              {/* Price & CTA */}
              <div className="flex items-center justify-between mt-auto pt-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-normal text-gray-500">from</span>
                  <span className="text-base sm:text-lg font-black text-gray-900">
                    ₹{price?.toLocaleString('en-IN') || '0'}
                  </span>
                </div>

                <Link
                  to={`/trip/${id}`}
                  className="text-xs font-bold text-[#00C9B7] border border-[#00C9B7]/30 bg-teal-50/50 hover:bg-[#00C9B7] hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200 inline-flex items-center gap-1 shadow-2xs"
                >
                  Details &rarr;
                </Link>
              </div>

            </div>
          </div>
        </div>

      </motion.div>

      <AllDatesModal
        isOpen={isModalOpen}
        onClose={(e) => { if (e) { e.preventDefault(); e.stopPropagation(); } setIsModalOpen(false); }}
        trip={trip}
      />
    </>
  );
};

export default TripCard;