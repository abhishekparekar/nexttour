import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Mountain, MapPin } from 'lucide-react';
import { useCachedCategories } from '../firebaseCache';
import { categoryVariants, easings, viewportConfig } from './animations';

const TrendingCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = useCachedCategories((data) => {
      const sorted = [...data].sort((a, b) => (a.order || 0) - (b.order || 0));
      setCategories(sorted.slice(0, 8));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const categoryColors = [
    { bg: 'bg-emerald-500', text: 'text-emerald-500' },
    { bg: 'bg-blue-500', text: 'text-blue-500' },
    { bg: 'bg-amber-500', text: 'text-amber-500' },
    { bg: 'bg-red-500', text: 'text-red-500' },
    { bg: 'bg-purple-500', text: 'text-purple-500' },
    { bg: 'bg-cyan-500', text: 'text-cyan-500' },
    { bg: 'bg-green-500', text: 'text-green-500' },
    { bg: 'bg-pink-500', text: 'text-pink-500' }
  ];

  if (loading) {
    return (
      <section className="py-16" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0, 201, 183,0.10) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.06) 0%, transparent 50%), linear-gradient(180deg, #FAFAFA 0%, #F4F4F8 100%)' }}>
        <div className="container-custom flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-10 h-10 text-[#00C9B7] animate-spin" />
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-16" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(0, 201, 183,0.10) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.06) 0%, transparent 50%), linear-gradient(180deg, #FAFAFA 0%, #F4F4F8 100%)' }}>
      <div className="container-custom">
        <motion.div className="text-center mb-10" initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={viewportConfig} transition={{ duration: 0.7, ease: easings.premium }}>
          <span className="inline-block px-4 py-2 bg-[#00C9B7]/10 text-[#00C9B7] rounded-full text-sm font-medium mb-4">Featured</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#111111] mb-4">Trending<span className="block text-gradient">Categories</span></h2>
          <p className="text-[#555555] max-w-xl mx-auto">Explore the most popular adventure categories loved by thousands of travelers</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" variants={categoryVariants.container} initial="hidden" whileInView="visible" viewport={viewportConfig}>
          {categories.map((category, index) => {
            const color = categoryColors[index % categoryColors.length];
            const categoryTitle = category.title || category.name || 'Adventure';
            return (
              <motion.div key={category.id} custom={index} variants={categoryVariants.card} whileHover={{ y: -6, scale: 1.02, transition: { type: "spring", stiffness: 150, damping: 15 } }} className="will-change-transform">
                <Link to={`/category/${category.id}`} className="group block bg-white rounded-2xl overflow-hidden border border-[#EEEEEE] hover:border-[#00C9B7]/50 transition-all duration-300 hover:shadow-card-hover">
                  <div className="relative h-40 overflow-hidden">
                    {category.image ? (<img src={category.image} alt={categoryTitle} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />) : (<div className="w-full h-full bg-gradient-to-br from-[#F8F9FB] to-white flex items-center justify-center"><Mountain className={`w-16 h-16 ${color.text} opacity-30`} /></div>)}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md ${color.bg} text-white`}>{category.order || index + 1}#</div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-[#111111] mb-2 group-hover:text-[#00C9B7] transition-colors line-clamp-1">{categoryTitle}</h3>
                    {category.description && <p className="text-[#555555] text-sm mb-3 line-clamp-2">{category.description}</p>}
                    <div className="flex items-center justify-between pt-3 border-t border-[#EEEEEE]">
                      <div className="flex items-center gap-1.5 text-[#888888] text-xs"><MapPin size={12} className="text-[#00C9B7]" /><span className="line-clamp-1">{category.location || 'Various Locations'}</span></div>
                      <div className="flex items-center gap-1 text-[#00C9B7] text-xs font-medium"><span>Explore</span><ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" /></div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default TrendingCategories;