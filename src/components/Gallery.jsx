import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Loader2, X } from 'lucide-react';
import { useCachedGallery } from '../firebaseCache';

const Gallery = () => {
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

  if (loading) {
    return (
      <section className="section-padding bg-[#F8F9FB]">
        <div className="container-custom flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-[#00C9B7] animate-spin" />
        </div>
      </section>
    );
  }

  if (images.length === 0) return null;

  return (
    <>
      <section className="section-padding bg-[#F8F9FB]">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-[#00C9B7]/10 text-[#00C9B7] rounded-full text-sm font-medium mb-4">Gallery</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#111111] mb-6">
              Captured <span className="text-gradient">Moments</span>
            </h2>
            <p className="text-[#555555] max-w-2xl mx-auto">
              Real adventures, real experiences. See what awaits you in the mountains.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.slice(0, 8).map((img, index) => (
              <motion.button
                key={img.id}
                onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }}
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ duration: 0.3 }}
                className={`relative group overflow-hidden rounded-2xl ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              >
                <img
                  src={img.url}
                  alt={img.title || 'Gallery image'}
                  className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${index === 0 ? 'h-64 md:h-full min-h-[300px]' : 'h-32 md:h-40'}`}
                 loading="lazy"/>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <Image className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 z-10"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={24} />
            </button>
            {images.length > 1 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + images.length) % images.length); }}
              >←</button>
            )}
            <motion.img
              src={images[lightboxIndex]?.url}
              alt={images[lightboxIndex]?.title}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            />
            {images.length > 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % images.length); }}
              >→</button>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center">
              <p className="font-medium">{images[lightboxIndex]?.title}</p>
              <p className="text-sm text-white/60">{lightboxIndex + 1} / {images.length}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Gallery;
