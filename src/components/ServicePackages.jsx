import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Users, Building, Palmtree, Church, Backpack, Ticket, Waves, Globe, Plane, Train, Building2, Car, Briefcase, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import { cardVariants, easings, viewportConfig } from './animations';

const tourPackages = [
  { id: 'honeymoon', title: 'Honeymoon Packages', description: 'Romantic getaways with candlelight dinners, private beaches, and unforgettable moments.', icon: Heart, image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80', color: 'pink', category: 'Domestic', price: 'Starting ₹25,000' },
  { id: 'family', title: 'Family Tour Package', description: 'Perfect family vacations with kid-friendly activities, sightseeing, and comfortable accommodations.', icon: Users, image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&q=80', color: 'blue', category: 'Domestic', price: 'Starting ₹18,000' },
  { id: 'group', title: 'Group Tour', description: 'Join exciting group adventures with like-minded travelers.', icon: Building, image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80', color: 'purple', category: 'Both', price: 'Starting ₹12,000' },
  { id: 'imagica', title: 'Imagica Day Trip', description: 'Thrilling amusement park experience with unlimited rides.', icon: Palmtree, image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?w=600&q=80', color: 'orange', category: 'Domestic', price: 'Starting ₹3,500' },
  { id: 'pilgrimage', title: 'Pilgrimage Tour', description: 'Spiritual journeys to sacred destinations.', icon: Church, image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=600&q=80', color: 'yellow', category: 'Both', price: 'Starting ₹8,000' },
  { id: 'student', title: 'Student Tour', description: 'Educational and fun trips for schools and colleges.', icon: Backpack, image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80', color: 'green', category: 'Domestic', price: 'Starting ₹5,000' },
  { id: 'balaji', title: 'Balaji Darshan', description: 'Hassle-free Tirupati Balaji darshan with VIP passes.', icon: Ticket, image: 'https://images.unsplash.com/photo-1624811533744-f85d2db2d35b?w=600&q=80', color: 'amber', category: 'Domestic', price: 'Starting ₹4,500' },
  { id: 'waterpark', title: 'Water Park Packages', description: 'Cool off with exciting water park adventures.', icon: Waves, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80', color: 'cyan', category: 'Domestic', price: 'Starting ₹2,500' }
];

const otherServices = [
  { id: 'flights', title: 'Flight Tickets', description: 'Domestic & International flights at best prices.', icon: Plane, image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80', color: 'sky', features: ['All Airlines', 'Best Prices', 'Instant Booking', '24/7 Support'] },
  { id: 'trains', title: 'Railway Tickets', description: 'Train bookings for all routes.', icon: Train, image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&q=80', color: 'indigo', features: ['All Routes', 'Confirmed Tickets', 'Group Bookings', 'Special Trains'] },
  { id: 'hotels', title: 'Hotel Booking', description: 'Premium hotels, resorts, and homestays.', icon: Building2, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', color: 'violet', features: ['5-Star to Budget', 'Free Cancellation', 'Best Rates', 'Verified Properties'] },
  { id: 'carrental', title: 'Car Rental', description: 'Self-drive and chauffeur-driven cars.', icon: Car, image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80', color: 'slate', features: ['All Vehicle Types', 'With/Without Driver', 'GPS Navigation', 'Road Assistance'] },
  { id: 'travel', title: 'Travel Tickets', description: 'Bus tickets, ferry bookings, and all transport.', icon: Briefcase, image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80', color: 'teal', features: ['Bus Booking', 'Ferry Tickets', 'Private Cabs', 'Airport Transfers'] },
  { id: 'passport', title: 'Passport Assistant', description: 'Complete passport services.', icon: FileText, image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80', color: 'emerald', features: ['Fresh Passport', 'Renewal', 'Tatkal Service', 'Document Verification'] }
];

const tourColorMap = { pink: { bg: 'bg-pink-100', text: 'text-pink-500' }, blue: { bg: 'bg-blue-100', text: 'text-blue-500' }, purple: { bg: 'bg-purple-100', text: 'text-purple-500' }, orange: { bg: 'bg-orange-100', text: 'text-orange-500' }, yellow: { bg: 'bg-yellow-100', text: 'text-yellow-500' }, green: { bg: 'bg-green-100', text: 'text-green-500' }, amber: { bg: 'bg-amber-100', text: 'text-amber-500' }, cyan: { bg: 'bg-cyan-100', text: 'text-cyan-500' } };
const serviceColorMap = { sky: { bg: 'bg-sky-100', text: 'text-sky-500' }, indigo: { bg: 'bg-indigo-100', text: 'text-indigo-500' }, violet: { bg: 'bg-violet-100', text: 'text-violet-500' }, slate: { bg: 'bg-slate-100', text: 'text-slate-500' }, teal: { bg: 'bg-teal-100', text: 'text-teal-500' }, emerald: { bg: 'bg-emerald-100', text: 'text-emerald-500' } };

const ServicePackages = () => {
  return (
    <>
      {/* Tour Packages Section */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 80% 10%, rgba(0, 201, 183,0.10) 0%, transparent 50%), radial-gradient(ellipse at 10% 90%, rgba(99,102,241,0.07) 0%, transparent 50%), linear-gradient(180deg, #FAFAFA 0%, #F4F4F8 100%)' }}>
        <div className="container-custom relative">
          <motion.div className="text-center mb-12" initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={viewportConfig} transition={{ duration: 0.7, ease: easings.premium }}>
            <div className="inline-flex items-center gap-2 bg-[#00C9B7]/10 border border-[#00C9B7]/20 rounded-full px-4 py-2 mb-4"><Globe className="w-4 h-4 text-[#00C9B7]" /><span className="text-[#00C9B7] text-sm font-medium">Our Services</span></div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#111111] mb-4">Explore Our <span className="text-gradient">Holiday Packages</span></h2>
            <p className="text-[#555555] max-w-2xl mx-auto text-lg">Premium travel experiences for every type of traveler.</p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" variants={cardVariants.container} initial="hidden" whileInView="visible" viewport={viewportConfig}>
            {tourPackages.map((pkg) => {
              const Icon = pkg.icon;
              const colors = tourColorMap[pkg.color];
              return (
                <motion.div key={pkg.id} variants={cardVariants.card} whileHover={{ y: -6, scale: 1.03, transition: { type: "spring", stiffness: 150, damping: 15 } }} className="will-change-transform">
                  <div className="group relative bg-white rounded-2xl overflow-hidden border border-[#EEEEEE] transition-all duration-300 hover:shadow-card-hover block">
                    <div className="relative h-48 overflow-hidden">
                      <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute top-3 left-3"><span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md ${colors.bg} ${colors.text}`}>{pkg.category}</span></div>
                      <div className={`absolute bottom-3 right-3 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md ${colors.bg}`}><Icon className={`w-6 h-6 ${colors.text}`} /></div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-[#111111] mb-2">{pkg.title}</h3>
                      <p className="text-[#555555] text-sm line-clamp-2 mb-3">{pkg.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#00C9B7] text-sm font-medium">{pkg.price}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Other Services Section - Deep luxury dark */}
      <section className="py-16 md:py-24 relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 10% 50%, rgba(0, 201, 183,0.12) 0%, transparent 45%), radial-gradient(ellipse at 90% 20%, rgba(99,102,241,0.10) 0%, transparent 45%), linear-gradient(160deg, #0f0f14 0%, #16161f 50%, #0d0d12 100%)' }}>
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="container-custom relative">
          <motion.div className="text-center mb-12" initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={viewportConfig} transition={{ duration: 0.7, ease: easings.premium }}>
            <div className="inline-flex items-center gap-2 bg-[#00C9B7]/10 border border-[#00C9B7]/20 rounded-full px-4 py-2 mb-4"><Briefcase className="w-4 h-4 text-[#00C9B7]" /><span className="text-[#00C9B7] text-sm font-medium">More Services</span></div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">Complete <span className="text-gradient">Travel Solutions</span></h2>
            <p className="text-white/50 max-w-2xl mx-auto text-lg">All your travel needs under one roof.</p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" variants={cardVariants.container} initial="hidden" whileInView="visible" viewport={viewportConfig}>
            {otherServices.map((service) => {
              const Icon = service.icon;
              const colors = serviceColorMap[service.color];
              return (
                <motion.div key={service.id} variants={cardVariants.card} whileHover={{ y: -6, scale: 1.03, transition: { type: "spring", stiffness: 150, damping: 15 } }} className="group relative rounded-2xl overflow-hidden border border-white/8 hover:border-[#00C9B7]/40 transition-all duration-300 will-change-transform hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' }}>
                  <div className="relative h-44 overflow-hidden">
                    <img src={service.image} alt={service.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-75" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f14] via-[#0f0f14]/40 to-transparent" />
                    <div className={`absolute top-4 left-4 w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-xl bg-white/10 border border-white/15 shadow-lg`}><Icon className={`w-7 h-7 text-white`} /></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#00C9B7] transition-colors">{service.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-4">{service.description}</p>
                    <div className="grid grid-cols-2 gap-2 mb-5">{service.features.map((feature, idx) => (<div key={idx} className="flex items-center gap-2 text-xs text-white/40"><CheckCircle className={`w-3.5 h-3.5 text-[#00C9B7]`} /><span>{feature}</span></div>))}</div>
                    <Link to="/contact" className="flex items-center justify-center gap-2 w-full py-3 bg-[#00C9B7] text-[#111111] rounded-xl font-semibold text-sm hover:bg-[#f0aa00] hover:shadow-[0_0_20px_rgba(0, 201, 183,0.4)] transition-all">Book Now <ArrowRight size={14} /></Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default ServicePackages;