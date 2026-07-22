import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import AllDatesModal from './AllDatesModal';

const PLACEHOLDER_IMAGE = '/placeholder.jpg';

// myair.link uses Hanken Grotesk as root font-family
const HK = "'Hanken Grotesk', sans-serif";

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
          
          // Display direct url immediately while caching in background
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

  /* ── Date logic (unchanged) ── */
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
  const otherDates    = displayDates.slice(1, 4); // max 3 date pills

  const fmt   = (d, opts) => d.toLocaleDateString('en-IN', opts);

  /* strip leading emoji */
  const cleanTitle =
    title?.replace(/^([\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])\s*/, '').trim() ?? title;

  /* badge — same colours as myair */
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
    'rgb(40, 167, 69)'; // exact myair green: rgb(40, 167, 69)

  return (
    <>
      {/*
        EXACT myair.link structure:
        <div cursor-pointer relative>          ← outer wrapper only
          <div image-card rounded shadow>      ← image IS the card
          <div info py-2>                      ← info sits BELOW image, no bg
      */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ cursor: 'pointer', position: 'relative', fontFamily: HK, width: '100%' }}
      >

        {/* ── IMAGE CARD — rounded-2xl shadow overflow-hidden ── */}
        {/* This IS the card, info sits below it */}
        <Link
          to={`/trip/${id}`}
          style={{
            display:      'block',
            position:     'relative',
            width:        '100%',
            aspectRatio:  '1 / 1',            // perfect square 1:1 aspect ratio
            borderRadius: '1rem',               // rounded-2xl = 16px
            boxShadow:    '1px 2px 6px #e6e5e5', // exact myair shadow
            overflow:     'hidden',
            WebkitMaskImage: '-webkit-radial-gradient(white, black)',
            isolation:    'isolate',
            lineHeight:   0,
          }}
        >
          <motion.img
            src={imageUrl}
            alt={cleanTitle}
            onError={() => setImageError(true)}
            loading="lazy"
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          {/*
            Badge — exact myair:
            class="absolute top-0 right-0 px-2 py-1"
            style="background-color: rgb(40,167,69); color: #fff"
            with ribbon-2 class giving border-bottom-left-radius
          */}
          {badgeLabel && (
            <div style={{
              position:            'absolute',
              top:                 0,
              right:               0,
              background:          badgeBg,
              color:               '#ffffff',
              padding:             '4px 10px',
              borderBottomLeftRadius: '10px',   // ribbon-2 folded corner effect
              fontFamily:          HK,
              fontSize:            '12px',
              fontWeight:          '700',
              letterSpacing:       '0.01em',
              textTransform:       'capitalize',
              zIndex:              5,
              lineHeight:          '1.4',
              pointerEvents:       'none',
            }}>
              {badgeLabel}
            </div>
          )}
        </Link>

        {/* ── INFO SECTION — py-2, plain, sits below image ── */}
        {/* class="py-2" → padding 8px top/bottom, no background, no border */}
        <div style={{ paddingTop: '8px', paddingBottom: '4px' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>

            {/* ── LEFT: date_holder — plain stacked text, NO border ── */}
            {nextDate ? (
              <div style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     0,
                border:         '1px solid #dedede',
                borderRadius:   '8px',
                background:     '#ffffff',
                minWidth:       '56px',
                width:          '56px',
                padding:        '8px 4px',
                gap:            '4px',
              }}>
                {/* Weekday — increased to 13px */}
                <span style={{
                  fontFamily: HK,
                  fontSize:   '13px',
                  fontWeight: '600',
                  color:      '#6b7280',
                  lineHeight: 1,
                }}>
                  {fmt(nextDate, { weekday: 'short' })}
                </span>

                {/* Day number — highlight bg ONLY on this span */}
                <span style={{
                  fontFamily:    HK,
                  fontSize:      '26px',
                  fontWeight:    '800',
                  color:         '#111111',
                  lineHeight:    1,
                  letterSpacing: '-0.03em',
                  background:    '#f0f4ff',
                  borderRadius:  '6px',
                  padding:       '2px 6px',
                  display:       'inline-block',
                }}>
                  {fmt(nextDate, { day: 'numeric' })}
                </span>

                {/* Month — increased to 13px */}
                <span style={{
                  fontFamily: HK,
                  fontSize:   '13px',
                  fontWeight: '600',
                  color:      '#6b7280',
                  lineHeight: 1,
                }}>
                  {fmt(nextDate, { month: 'short' })}
                </span>
              </div>
            ) : (
              /* No date — empty left column placeholder */
              <div style={{ width: '44px', flexShrink: 0 }} />
            )}

            {/* ── RIGHT: date pills + title + price ── */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>

              {/* Date pills row + All Dates button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', flexWrap: 'nowrap', overflow: 'hidden' }}>

                {/* Pills — px-2 py-1 rounded-md text-xs, bg rgba(0,0,0,0.05), border #dedede */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: 0, overflow: 'hidden' }}>
                  {nextDate && otherDates.map((date, i) => (
                    <div key={i} style={{
                      padding:      '4px 8px',          // px-2 py-1
                      borderRadius: '6px',               // rounded-md
                      fontSize:     '12px',              // text-xs
                      fontWeight:   '600',
                      fontFamily:   HK,
                      color:        '#111111',
                      background:   'rgba(0, 0, 0, 0.05)', // exact myair
                      border:       '1px solid rgb(222, 222, 222)', // exact myair #dedede
                      whiteSpace:   'nowrap',
                      flexShrink:   0,
                    }}>
                      {fmt(date, { day: 'numeric', month: 'short' })}
                    </div>
                  ))}

                  {!nextDate && (
                    <span style={{ fontFamily: HK, fontSize: '12px', color: '#9ca3af' }}>No dates</span>
                  )}
                </div>

                {/* All Dates button — h-[1.65rem] border-[2px] px-2 gap-1 text-xs */}
                <span style={{ flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsModalOpen(true); }}
                    style={{
                      display:        'inline-flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      whiteSpace:     'nowrap',
                      height:         '1.65rem',       // h-[1.65rem] = 26.4px
                      padding:        '0 8px',          // px-2
                      gap:            '4px',             // gap-1
                      border:         '2px solid #d1d5db', // border-[2px] border-input
                      borderRadius:   '6px',             // rounded-md
                      background:     '#ffffff',
                      fontFamily:     HK,
                      fontSize:       '12px',            // text-xs
                      fontWeight:     '500',
                      color:          '#111111',
                      cursor:         'pointer',
                      outline:        'none',
                      transition:     'background 0.12s',
                      marginBottom:   '4px',             // mb-1
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                  >
                    <Calendar style={{ width: '14px', height: '14px', color: '#6b7280' }} strokeWidth={2} />
                    All Dates
                  </button>
                </span>
              </div>

              {/* Title — h6 capitalize text-sm font-bold leading-tight */}
              <Link to={`/trip/${id}`} style={{ textDecoration: 'none' }}>
                <h6 style={{
                  margin:          0,
                  marginBottom:    '4px',
                  fontFamily:      HK,
                  fontSize:        '14px',           // text-sm
                  fontWeight:      '700',            // font-bold
                  color:           '#111827',
                  lineHeight:      '1.25',           // leading-tight
                  textTransform:   'capitalize',     // capitalize
                  display:         '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow:        'hidden',
                }}>
                  {cleanTitle}
                </h6>

                {/* Price — "from ₹ 1,599" */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: HK, display: 'inline-flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontFamily: HK, fontSize: '16px', fontWeight: '300', color: '#374151' }}>
                      from
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
                      <span style={{ fontFamily: HK, fontSize: '17px', fontWeight: '500', marginRight: '2px', color: '#111111' }}>₹</span>
                      <span style={{ fontFamily: HK, fontSize: '19px', fontWeight: '900', color: '#111111' }}>
                        {price?.toLocaleString('en-IN') || '0'}
                      </span>
                    </span>
                  </span>
                  <span style={{
                    fontFamily:     HK,
                    fontSize:       '12px',
                    fontWeight:     '800',
                    color:          '#F5B301',
                    border:         '1px solid #dedede',
                    borderRadius:   '8px',
                    background:     '#ffffff',
                    padding:        '8px 12px',
                    display:        'inline-flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            '2px',
                    boxShadow:      '0 1px 2px rgba(0, 0, 0, 0.02)'
                  }}>
                    More Details &rarr;
                  </span>
                </div>
              </Link>

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