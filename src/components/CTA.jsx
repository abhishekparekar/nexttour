import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Mail } from 'lucide-react';
import { ctaVariants, easings, viewportConfig } from './animations';

const CTA = () => {
  return (
    <section className="section-padding relative overflow-hidden" style={{ background: 'radial-gradient(circle at 30% 40%, rgba(245, 179, 1, 0.1), transparent 50%), linear-gradient(180deg, #FFFFFF 0%, #F8F9FB 100%)' }}>
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')` }} />

      <div className="container-custom relative">
        <motion.div className="max-w-4xl mx-auto text-center" variants={ctaVariants.container} initial="hidden" whileInView="visible" viewport={viewportConfig}>
          <motion.div variants={ctaVariants.badge} className="inline-flex items-center gap-2 bg-white/90 border border-[#EEEEEE] rounded-full px-6 py-2 mb-8 shadow-premium backdrop-blur-sm">
            <span className="w-2 h-2 bg-[#F5B301] rounded-full animate-pulse" />
            <span className="text-[#555555] text-sm font-medium">Limited Time Offer</span>
          </motion.div>

          <motion.h2 variants={ctaVariants.content} className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-xl">
            Ready to Book Your<br /><span className="text-[#F5B301]">Next Adventure?</span>
          </motion.h2>

          <motion.p variants={ctaVariants.content} className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-10 drop-shadow">
            Don't let the mountains wait. Join thousands of happy travelers who chose Trek Premi for their <span className="text-[#F5B301] font-medium">premium</span> adventures.
          </motion.p>

          <motion.div variants={ctaVariants.buttons} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
              <Link to="/trips" className="btn-primary inline-flex items-center gap-2 text-lg px-10 py-5 group">
                Explore Treks
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><ArrowRight size={20} /></motion.div>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
              <Link to="/contact" className="btn-secondary inline-flex items-center gap-2 text-lg px-10 py-5">Contact Us</Link>
            </motion.div>
          </motion.div>

          <motion.div variants={ctaVariants.content} className="flex flex-wrap justify-center items-center gap-8 pt-8 border-t border-white/20">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#F5B301]" />
              <span className="text-white">+91 9156434444</span>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#F5B301]" />
              <span className="text-white">trekpremi01@gmail.com</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;