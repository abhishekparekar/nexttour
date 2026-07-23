import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, Loader2, MapPin } from 'lucide-react';
import { useCachedTestimonials } from '../firebaseCache';

const TestimonialsPage = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return useCachedTestimonials((data) => { setTestimonials(data); setLoading(false); });
  }, []);

  const active = testimonials.filter(t => t.status === 'active' || !t.status);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-20">
      <Loader2 className="w-10 h-10 animate-spin text-[#00C9B7]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Hero Banner */}
      <div className="relative h-[32vh] min-h-[240px] w-full overflow-hidden rounded-b-3xl shadow-md">
        <img 
          src="https://images.unsplash.com/photo-1522199755839-a2bacb67c546?q=80&w=2000" 
          alt="Testimonials Banner" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-md">Trekker Stories</h1>
            <p className="text-base md:text-lg text-gray-200 max-w-2xl mx-auto font-medium drop-shadow-sm">
              Real stories from real adventurers who traveled with NextTour
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 lg:py-12">
        {active.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 bg-white rounded-3xl border border-[#e5e5e5] shadow-sm max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 bg-[#f8f9fa] rounded-full flex items-center justify-center mx-auto mb-4">
              <Quote className="w-8 h-8 text-[#9CA3AF]" />
            </div>
            <h3 className="text-xl font-bold text-[#111] mb-2">No Stories Yet</h3>
            <p className="text-[#555]">Check back soon for new adventurer testimonials.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            <AnimatePresence>
              {active.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="bg-white rounded-3xl p-8 border border-[#e5e5e5] shadow-sm hover:shadow-xl transition-all duration-300 relative group flex flex-col h-full"
                >
                  {/* Decorative background element */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#00C9B7]/10 to-transparent rounded-tr-3xl rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="w-12 h-12 rounded-2xl bg-[#f8f9fa] group-hover:bg-[#00C9B7] flex items-center justify-center mb-6 transition-colors duration-300">
                    <Quote className="w-5 h-5 text-[#00C9B7] group-hover:text-white transition-colors duration-300" fill="currentColor" />
                  </div>
                  
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14} className={j < (t.rating || 5) ? 'text-[#00C9B7] fill-[#00C9B7]' : 'text-[#e5e5e5] fill-[#e5e5e5]'} />
                    ))}
                  </div>

                  <p className="text-[#444] leading-relaxed mb-8 flex-grow relative z-10 text-[15px]">
                    "{t.text || t.message || t.content || 'Great experience!'}"
                  </p>
                  
                  <div className="flex items-center gap-4 pt-5 border-t border-[#f0f0f0]">
                    {t.image || t.avatar ? (
                      <img src={t.image || t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-[#f8f9fa]" loading="lazy" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#00C9B7]/20 flex items-center justify-center border-2 border-white shadow-sm">
                        <span className="text-[#00C9B7] font-bold text-lg">{t.name?.charAt(0) || 'A'}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-[#111] text-sm leading-tight mb-1">{t.name || 'Adventurer'}</p>
                      {t.location && (
                        <p className="text-[#888] text-xs flex items-center gap-1 font-medium">
                          <MapPin size={10} /> {t.location}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestimonialsPage;
