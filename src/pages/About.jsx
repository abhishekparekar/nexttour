import { useState, useEffect } from 'react';
import { Award, Users, Shield, Heart, Compass, Mountain, Map as MapIcon, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { subscribeToAboutSettings, DEFAULT_ABOUT_SETTINGS } from '../firebase';

const statIcons = [Compass, Mountain, Users, MapIcon];
const valueIcons = [Shield, Award, Users, Heart];

const About = () => {
  const [aboutData, setAboutData] = useState(DEFAULT_ABOUT_SETTINGS);

  useEffect(() => {
    const unsub = subscribeToAboutSettings((data) => {
      if (data) setAboutData(data);
    });
    return () => unsub();
  }, []);

  const stats = (aboutData.stats || DEFAULT_ABOUT_SETTINGS.stats).map((s, idx) => ({
    ...s,
    icon: statIcons[idx % statIcons.length]
  }));

  const values = (aboutData.values || DEFAULT_ABOUT_SETTINGS.values).map((v, idx) => ({
    ...v,
    icon: valueIcons[idx % valueIcons.length]
  }));

  const fadeInUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Hero Banner */}
      <div className="relative h-[32vh] min-h-[240px] w-full overflow-hidden rounded-b-3xl shadow-md">
        <img 
          src={aboutData.heroImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=2000&q=80'} 
          alt="About NextTour" 
          className="absolute inset-0 w-full h-full object-cover" 
          onError={(e) => { e.target.onerror = null; e.target.src = '/herobg1.png'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-md">
              {aboutData.heroTitle || 'Our Story'}
            </h1>
            <p className="text-base md:text-lg text-gray-200 max-w-2xl mx-auto font-medium drop-shadow-sm">
              {aboutData.heroSubtitle || 'Your trusted partner for extraordinary mountain adventures since 2014.'}
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
              <div className="absolute -inset-3 bg-[#00C9B7]/10 rounded-[2rem] transform -rotate-3 pointer-events-none" />
              <img 
                src={aboutData.storyImage || '/about.png'} 
                alt="Our Journey" 
                className="relative z-10 w-full h-auto max-h-[450px] rounded-2xl shadow-lg object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = '/herobg2.jpg'; }}
              />
            </div>
            
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00C9B7]/10 text-[#00C9B7] rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                <Star size={14} /> {aboutData.storyBadge || 'Who We Are'}
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#111] mb-4 leading-tight">
                {aboutData.storyTitle || 'Where Adventure Meets Excellence'}
              </h2>
              <div className="space-y-4 text-[#555] text-base leading-relaxed">
                <p>{aboutData.storyParagraph1}</p>
                {aboutData.storyParagraph2 && <p>{aboutData.storyParagraph2}</p>}
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

          {/* Leadership Section */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6 }} variants={fadeInUp}>
            <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 lg:p-10 border border-[#e5e5e5] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#00C9B7]/5 rounded-bl-full pointer-events-none" />
              
              <div className="text-center mb-6 sm:mb-10 relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#111] mb-2 sm:mb-3">
                  {aboutData.leadershipTitle || 'Meet Our Leadership'}
                </h2>
                <p className="text-[#555] text-xs sm:text-base max-w-xl mx-auto">
                  {aboutData.leadershipSubtitle || "The experienced team driving NextTour's vision and ensuring excellence in every journey."}
                </p>
              </div>
              
              {/* Mobile Fast Infinite Left Marquee (< sm screen) */}
              <div className="sm:hidden overflow-hidden w-full relative py-2">
                <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

                <motion.div
                  className="flex gap-4 w-max"
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{
                    repeat: Infinity,
                    ease: 'linear',
                    duration: Math.max(6, (aboutData.teamMembers || DEFAULT_ABOUT_SETTINGS.teamMembers).length * 2.5)
                  }}
                >
                  {[
                    ...(aboutData.teamMembers || DEFAULT_ABOUT_SETTINGS.teamMembers),
                    ...(aboutData.teamMembers || DEFAULT_ABOUT_SETTINGS.teamMembers),
                    ...(aboutData.teamMembers || DEFAULT_ABOUT_SETTINGS.teamMembers),
                    ...(aboutData.teamMembers || DEFAULT_ABOUT_SETTINGS.teamMembers)
                  ].map((member, i) => (
                    <div 
                      key={i} 
                      className="w-48 flex-shrink-0 bg-[#f8f9fa] border border-[#e5e5e5] rounded-2xl p-4 flex flex-col items-center text-center shadow-sm"
                    >
                      <div className="relative mb-3">
                        <img
                          src={member.image || '/male.jpeg'}
                          alt={member.name}
                          className="w-24 h-24 rounded-full object-cover border-3 border-white shadow-md"
                        />
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#00C9B7] rounded-full flex items-center justify-center shadow-md border-2 border-white">
                          <Award size={12} className="text-white" />
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-[#111] mb-1 truncate w-full">{member.name}</h3>
                      <span className="inline-block px-2.5 py-0.5 bg-white text-[#555] text-[11px] font-semibold rounded-full border border-[#e5e5e5] truncate max-w-full">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Tablet & Desktop Grid (>= sm screen) */}
              <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto relative z-10">
                {(aboutData.teamMembers || DEFAULT_ABOUT_SETTINGS.teamMembers).map((member, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-[#00C9B7] rounded-full scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 blur-sm" />
                      <img
                        src={member.image || '/male.jpeg'}
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
