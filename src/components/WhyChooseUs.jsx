import { motion } from 'framer-motion';
import { Shield, Award, Users, Clock, Headphones, Map, Sparkles, Heart, Star } from 'lucide-react';
import { easings, viewportConfig } from './animations';

const features = [
  { icon: Shield, title: 'Safety First', description: 'Certified guides and comprehensive safety protocols for every adventure.', color: 'emerald' },
  { icon: Award, title: 'Expert Guides', description: 'Experienced professionals who know the trails inside out.', color: 'gold' },
  { icon: Users, title: 'Small Groups', description: 'Intimate group sizes ensuring personalized attention.', color: 'blue' },
  { icon: Clock, title: 'Flexible Booking', description: 'Easy rescheduling and cancellation policies.', color: 'purple' },
  { icon: Headphones, title: '24/7 Support', description: 'Round-the-clock assistance during your journey.', color: 'cyan' },
  { icon: Map, title: 'Curated Routes', description: 'Handpicked trails for the best experiences.', color: 'orange' }
];

const colorMap = {
  emerald: { bg: 'bg-emerald-50', border: 'hover:border-emerald-300', icon: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-600' },
  gold: { bg: 'bg-amber-50', border: 'hover:border-amber-300', icon: 'text-amber-500', badge: 'bg-amber-50 text-amber-600' },
  blue: { bg: 'bg-blue-50', border: 'hover:border-blue-300', icon: 'text-blue-500', badge: 'bg-blue-50 text-blue-600' },
  purple: { bg: 'bg-purple-50', border: 'hover:border-purple-300', icon: 'text-purple-500', badge: 'bg-purple-50 text-purple-600' },
  cyan: { bg: 'bg-cyan-50', border: 'hover:border-cyan-300', icon: 'text-cyan-500', badge: 'bg-cyan-50 text-cyan-600' },
  orange: { bg: 'bg-orange-50', border: 'hover:border-orange-300', icon: 'text-orange-500', badge: 'bg-orange-50 text-orange-600' }
};

const WhyChooseUs = () => {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,201,183,0.09) 0%, transparent 55%), radial-gradient(ellipse at 90% 100%, rgba(139,92,246,0.07) 0%, transparent 50%), linear-gradient(180deg, #FAFAFA 0%, #F2F2F7 100%)' }}>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#00C9B7]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative">
        <motion.div className="text-center mb-16" initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={viewportConfig} transition={{ duration: 0.7, ease: easings.premium }}>
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#00C9B7]/50" />
            <Sparkles className="w-5 h-5 text-[#00C9B7] animate-pulse" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#00C9B7]/50" />
          </div>
          <span className="inline-block px-5 py-2 bg-white border border-[#EEEEEE] rounded-full text-sm font-medium text-[#555555] mb-6 shadow-premium">Why NextTour</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#111111] mb-6 tracking-tight">The <span className="text-[#00C9B7]">Premium</span> Experience</h2>
          <p className="text-[#555555] max-w-2xl mx-auto text-lg leading-relaxed">We're not just another travel company. We craft extraordinary journeys that become cherished memories for a lifetime.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colors = colorMap[feature.color];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: easings.premium }}
                whileHover={{ scale: 1.03, y: -5, transition: { type: "spring", stiffness: 150, damping: 15 } }}
                className={`group relative p-8 rounded-premium-lg bg-white border border-[#EEEEEE] ${colors.border} transition-all duration-300 hover:shadow-card-hover`}
              >
                <div className={`w-16 h-16 rounded-2xl ${colors.bg} border border-[#EEEEEE] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}><Icon className={`w-8 h-8 ${colors.icon}`} /></div>
                <h3 className="text-xl font-bold text-[#111111] mb-3 group-hover:text-[#F5B301] transition-colors duration-300">{feature.title}</h3>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colors.badge} text-xs font-medium mb-4`}><Star className="w-3 h-3" />Premium</div>
                <p className="text-[#555555] leading-relaxed group-hover:text-[#111111] transition-colors duration-300">{feature.description}</p>
                <div className={`absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-[#F5B301]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full`} />
              </motion.div>
            );
          })}
        </div>

        <motion.div className="mt-16 flex flex-wrap justify-center items-center gap-8 md:gap-12" initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={viewportConfig} transition={{ duration: 0.6, delay: 0.4, ease: easings.premium }}>
          {[{ icon: Shield, text: 'Licensed & Insured' }, { icon: Heart, text: '5-Star Reviews' }, { icon: Award, text: 'Award Winning' }, { icon: Users, text: '10K+ Happy Clients' }].map((badge, i) => (
            <motion.div key={i} className="flex items-center gap-3 text-[#555555]" whileHover={{ scale: 1.05, color: '#F5B301' }} transition={{ duration: 0.2 }}>
              <div className="w-10 h-10 rounded-xl bg-white border border-[#EEEEEE] flex items-center justify-center shadow-premium"><badge.icon className="w-5 h-5 text-[#F5B301]" /></div>
              <span className="text-sm font-medium">{badge.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseUs;