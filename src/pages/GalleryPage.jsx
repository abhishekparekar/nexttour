import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, ChevronLeft, ChevronRight, Image as ImageIcon, Camera } from 'lucide-react';
import { useCachedGallery } from '../firebaseCache';

const GalleryPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    return useCachedGallery((data) => {
      setImages(data);
      setLoading(false);
    });
  }, []);

  const open = (i) => { setLightboxIndex(i); setLightboxOpen(true); };
  const prev = (e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + images.length) % images.length); };
  const next = (e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % images.length); };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-[#00C9B7] mb-4" />
      <p className="text-[#555] font-medium tracking-wide">Curating memories...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Hero Banner - Full Bleed Navbar Alignment */}
      <div className="relative h-[36vh] sm:h-[40vh] min-h-[280px] w-full overflow-hidden shadow-md bg-[#0d1117] flex items-center justify-center pt-16 md:pt-20 select-none">
        <img
          src="https://images.unsplash.com/photo-1522199755839-a2bacb67c546?q=80&w=2000"
          alt="Gallery Banner"
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => { e.target.onerror = null; e.target.src = '/herobg1.png'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/45 to-black/85 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="text-center max-w-3xl"
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-md">Captured Moments</h1>
            <p className="text-sm md:text-base lg:text-lg text-gray-200 font-medium drop-shadow-sm leading-relaxed">
              Explore the raw beauty of our expeditions, unfiltered and unforgettable.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="bg-[#f8f9fa] w-full pt-12 pb-24">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">

          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-[#ebebeb] shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-[#111] mb-2">No photos yet</h3>
              <p className="text-[#555]">We are still gathering our best shots.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {images.map((img, i) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: (i % 8) * 0.1, duration: 0.6 }}
                  className="cursor-pointer group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 bg-gray-100 aspect-[4/3]"
                  onClick={() => open(i)}
                >
                  <img
                    src={img.url}
                    alt={img.title || 'Expedition Photo'}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Clean Title Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out flex items-end justify-between">
                    <h3 className="text-white font-bold text-lg drop-shadow-md leading-tight pr-4">
                      {img.title || 'Adventure Moment'}
                    </h3>
                    <div className="w-8 h-8 rounded-full bg-[#00C9B7] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <ImageIcon size={14} className="text-[#111]" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modern Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Blurry Backdrop */}
            <div
              className="absolute inset-0 bg-black/90 backdrop-blur-xl cursor-pointer"
              onClick={() => setLightboxOpen(false)}
            />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
              <div className="text-white/80 font-medium tracking-widest text-xs uppercase px-4 py-2 bg-white/10 rounded-full backdrop-blur-md">
                {lightboxIndex + 1} <span className="mx-2 opacity-50">/</span> {images.length}
              </div>
              <button
                className="w-12 h-12 bg-white/10 hover:bg-[#00C9B7] hover:text-[#111] border border-white/20 rounded-full flex items-center justify-center text-white transition-all duration-300 pointer-events-auto"
                onClick={() => setLightboxOpen(false)}
              >
                <X size={24} strokeWidth={2} />
              </button>
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/5 hover:bg-white/20 border border-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all duration-300 z-10 hidden md:flex"
                  onClick={prev}
                >
                  <ChevronLeft size={30} strokeWidth={1.5} />
                </button>
                <button
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/5 hover:bg-white/20 border border-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all duration-300 z-10 hidden md:flex"
                  onClick={next}
                >
                  <ChevronRight size={30} strokeWidth={1.5} />
                </button>
              </>
            )}

            {/* Image Container */}
            <div className="relative z-0 max-w-7xl mx-auto px-4 md:px-24 flex flex-col items-center pointer-events-none w-full h-full justify-center">
              <motion.img
                key={lightboxIndex}
                src={images[lightboxIndex]?.url}
                alt={images[lightboxIndex]?.title}
                className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl pointer-events-auto"
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />

              {/* Image Title */}
              <motion.div
                key={`title-${lightboxIndex}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 text-center"
              >
                <h3 className="text-white text-xl md:text-2xl font-semibold drop-shadow-md">
                  {images[lightboxIndex]?.title || 'Adventure Moment'}
                </h3>
              </motion.div>
            </div>

            {/* Mobile Nav Tap Zones */}
            <div className="absolute inset-y-0 left-0 w-1/3 md:hidden z-0" onClick={prev} />
            <div className="absolute inset-y-0 right-0 w-1/3 md:hidden z-0" onClick={next} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryPage;
