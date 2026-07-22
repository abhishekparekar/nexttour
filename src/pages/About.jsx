import { Award, Users, Shield, Heart, Compass, Mountain, Map as MapIcon, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const About = () => {
  const stats = [
    { value: '8+', label: 'Years Experience', icon: Compass },
    { value: '500+', label: 'Treks Completed', icon: Mountain },
    { value: '10k+', label: 'Happy Trekkers', icon: Users },
    { value: '50+', label: 'Destinations', icon: MapIcon }
  ];

  const values = [
    { icon: Shield, title: 'Safety First', description: 'Your safety is our top priority. We maintain the highest safety standards with certified guides and comprehensive protocols.' },
    { icon: Award, title: 'Premium Quality', description: 'From accommodations to equipment, we ensure premium quality at every step of your journey.' },
    { icon: Users, title: 'Expert Team', description: 'Our team of certified mountaineers and local guides bring years of experience and deep regional knowledge.' },
    { icon: Heart, title: 'Sustainable Travel', description: 'We are committed to eco-friendly practices and supporting local communities in the mountains.' }
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <div className="relative h-[30vh] min-h-[250px] w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=2000&q=80" 
          alt="About NextTour" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-16 px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-md">Our Story</h1>
            <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto font-light drop-shadow-sm">
              Your trusted partner for extraordinary mountain adventures since 2014.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="bg-[#f8f9fa] w-full py-12">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
          
          {/* Story Section */}
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }} variants={fadeInUp}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-16"
          >
            <div className="relative">
              <div className="absolute -inset-3 bg-[#00C9B7]/10 rounded-[2rem] transform -rotate-3" />
              <img 
                src="/about.png" 
                alt="Our Journey" 
                className="relative rounded-2xl shadow-lg w-full object-cover aspect-video"
              />
            </div>
            
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00C9B7]/10 text-[#00C9B7] rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                <Star size={14} /> Who We Are
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#111] mb-4 leading-tight">Where Adventure <br/><span className="text-[#00C9B7]">Meets Excellence</span></h2>
              <div className="space-y-4 text-[#555] text-base leading-relaxed">
                <p>
                  NextTour was born from a simple belief: everyone deserves to experience the transformative power of mountain adventures. Founded by seasoned mountaineers, we've grown from a small group of passionate trekkers to one of India's most trusted adventure travel companies.
                </p>
                <p>
                  Our mission is to create unforgettable journeys that push boundaries while maintaining the highest standards of safety, sustainability, and customer satisfaction.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} variants={fadeInUp}
                className="bg-white rounded-xl p-3 flex items-center gap-3 border border-[#e5e5e5] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-[#00C9B7]/10 rounded-lg flex-shrink-0 flex items-center justify-center group-hover:bg-[#00C9B7] transition-colors duration-300">
                  <stat.icon size={18} className="text-[#00C9B7] group-hover:text-white transition-colors duration-300" strokeWidth={2} />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold text-[#111] mb-1 font-poppins leading-none tracking-tight">{stat.value}</div>
                  <div className="text-[#777] text-[10px] font-bold uppercase tracking-wider leading-none">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Core Values */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6 }} variants={fadeInUp} className="mb-16">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00C9B7]/10 text-[#00C9B7] rounded-full text-xs font-bold uppercase tracking-widest mb-3">
                 Our Principles
              </div>
              <h2 className="text-3xl font-bold text-[#111]">Our Core Values</h2>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {values.map((value, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-[#e5e5e5] shadow-sm hover:shadow-lg hover:border-[#00C9B7]/30 transition-all duration-300 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-[#00C9B7]/10 rounded-xl flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-[#00C9B7]" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-[#111] mb-2">{value.title}</h3>
                  <p className="text-[#555] text-sm leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Leadership */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6 }} variants={fadeInUp}>
            <div className="bg-white rounded-[1.5rem] p-8 lg:p-10 border border-[#e5e5e5] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#00C9B7]/5 rounded-bl-full pointer-events-none" />
              
              <div className="text-center mb-10 relative z-10">
                <h2 className="text-3xl font-bold text-[#111] mb-3">Meet Our Leadership</h2>
                <p className="text-[#555] text-base max-w-xl mx-auto">The experienced team driving NextTour's vision and ensuring excellence in every journey.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto relative z-10">
                {[
                  { name: 'Akash Jalatkar', role: 'Founder & Lead Guide', image: '/male.jpeg' },
                  { name: 'Swapnali Annadate', role: 'Head Of Operations', image: '/female.png' },
                ].map((member, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-[#00C9B7] rounded-full scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 blur-sm" />
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md relative z-10"
                      />
                      <div className="absolute bottom-0 right-1 w-7 h-7 bg-[#00C9B7] rounded-full flex items-center justify-center shadow-md z-20 border-2 border-white">
                        <Award size={14} className="text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-[#111] mb-1">{member.name}</h3>
                    <span className="inline-block px-3 py-1 bg-[#f8f9fa] text-[#555] text-sm font-semibold rounded-full border border-[#e5e5e5]">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default About;
