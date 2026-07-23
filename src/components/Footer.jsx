import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube, Compass, ArrowUpRight } from 'lucide-react';
import { subscribeToFooterSettings, DEFAULT_FOOTER_SETTINGS } from '../firebase';
import { useCachedCategories } from '../firebaseCache';

// WhatsApp icon SVG
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const DEFAULT_CATEGORIES = [
  { id: 'monsoon', title: 'Monsoon Treks' },
  { id: 'himalayan', title: 'Himalayan Treks' },
  { id: 'beach', title: 'Beach Camping' },
  { id: 'forts', title: 'Fort Expeditions' },
  { id: 'weekend', title: 'Weekend Getaways' },
  { id: 'waterfalls', title: 'Waterfalls Exploration' }
];

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState(DEFAULT_FOOTER_SETTINGS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    const unsubSettings = subscribeToFooterSettings((data) => {
      if (data) setSettings(data);
    });

    const unsubCategories = useCachedCategories((data) => {
      if (data && data.length > 0) {
        const formatted = data.map(c => ({
          id: c.id,
          title: c.title || c.name || 'Category'
        }));
        
        // Ensure a minimum of 6 categories are displayed
        if (formatted.length < 6) {
          const filled = [...formatted];
          DEFAULT_CATEGORIES.forEach(def => {
            if (filled.length < 6 && !filled.some(f => f.title.toLowerCase() === def.title.toLowerCase())) {
              filled.push(def);
            }
          });
          setCategories(filled);
        } else {
          setCategories(formatted.slice(0, 8)); // Display up to 8 top categories
        }
      }
    });

    return () => {
      unsubSettings();
      unsubCategories();
    };
  }, []);

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'Trips Catalog', path: '/trips' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'Photo Gallery', path: '/gallery' },
    { name: 'Testimonials', path: '/testimonials' },
  ];

  const socialLinks = [
    { icon: Facebook, href: settings.socialLinks?.facebook || 'https://facebook.com', label: 'Facebook' },
    { icon: Instagram, href: settings.socialLinks?.instagram || 'https://www.instagram.com/trekpremii', label: 'Instagram' },
    { icon: WhatsAppIcon, href: settings.socialLinks?.whatsapp || 'https://wa.me/message/FH3CMQXFFIY2H1', label: 'WhatsApp' },
    { icon: Youtube, href: settings.socialLinks?.youtube || 'https://youtube.com', label: 'YouTube' },
  ];

  return (
    <footer className="bg-[#070a0e] text-white border-t border-white/10 relative overflow-hidden pt-16 pb-8 select-none">
      {/* Ambient Top Glow Effect */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00C9B7]/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Footer Grid - 2-Column Side-by-Side on Mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8 sm:mb-12">

          {/* Brand & 3D Logo (Full Width on Mobile) */}
          <motion.div 
            className="col-span-2 sm:col-span-1 lg:col-span-1 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="inline-block group">
              <img 
                src="/nexttour.jpeg" 
                alt="NextTour Logo" 
                className="h-9 sm:h-11 w-auto object-contain rounded-xl mix-blend-screen drop-shadow-[0_4px_16px_rgba(0,201,183,0.6)] filter brightness-110 group-hover:scale-105 transition-all duration-300"
              />
            </Link>

            <p className="text-gray-400 text-xs leading-relaxed font-normal max-w-sm">
              Your ultimate travel &amp; adventure partner. We curate thrilling expeditions, monsoon treks, and scenic camping journeys crafted for lifetime memories.
            </p>

            <div className="pt-1">
              <h5 className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Follow Our Journeys</h5>
              <div className="flex gap-2">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 bg-white/5 hover:bg-[#00C9B7] hover:text-white border border-white/10 hover:border-[#00C9B7] hover:shadow-[0_0_15px_rgba(0,201,183,0.5)] transition-all duration-300"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon size={15} />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick Links (Col 1 on Mobile 2-Grid) */}
          <motion.div 
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-xs font-black text-[#00C9B7] mb-3.5 uppercase tracking-widest flex items-center gap-1.5">
              <Compass size={13} className="text-[#00C9B7]" /> Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.path} 
                    className="text-gray-300 hover:text-[#00C9B7] transition-all duration-200 inline-flex items-center gap-1.5 text-xs font-medium group"
                  >
                    <span className="w-1.5 h-1.5 bg-[#00C9B7] rounded-full group-hover:scale-150 group-hover:shadow-[0_0_8px_#00C9B7] transition-all flex-shrink-0" />
                    <span className="group-hover:translate-x-1 transition-transform truncate">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Dynamic Categories (Col 2 on Mobile 2-Grid) */}
          <motion.div 
            className="col-span-1"
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-xs font-black text-[#00C9B7] mb-3.5 uppercase tracking-widest">Categories</h4>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id || cat.title}>
                  <Link 
                    to={`/trips?category=${cat.id}`} 
                    className="text-gray-300 hover:text-[#00C9B7] transition-all duration-200 inline-flex items-center gap-1 text-xs font-medium group truncate max-w-full"
                  >
                    <ArrowUpRight size={12} className="text-gray-500 group-hover:text-[#00C9B7] transition-all flex-shrink-0" />
                    <span className="truncate">{cat.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info (Full Width on Mobile) */}
          <motion.div 
            className="col-span-2 sm:col-span-1 lg:col-span-1"
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="text-xs font-black text-[#00C9B7] mb-3.5 uppercase tracking-widest">Contact Us</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-[#00C9B7] mt-0.5">
                  <MapPin size={14} />
                </div>
                <p className="text-gray-300 text-xs leading-relaxed font-medium">
                  {settings.contactUs?.address || 'Sai Vihar Colony, Near Sai Mandir, MIDC, Ranjangaon Shenpunji, Waluj, Wadgaon Kolhati, Maharashtra 431001'}
                </p>
              </li>

              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-[#00C9B7]">
                  <Phone size={14} />
                </div>
                <div className="flex flex-wrap text-xs font-medium gap-x-3 gap-y-0.5">
                  <a href={`tel:${(settings.contactUs?.phone1 || '+919156434444').replace(/\s+/g, '')}`} className="text-gray-300 hover:text-[#00C9B7] transition-colors">
                    {settings.contactUs?.phone1 || '+91 9156434444'}
                  </a>
                  {settings.contactUs?.phone2 && (
                    <a href={`tel:${settings.contactUs.phone2.replace(/\s+/g, '')}`} className="text-gray-300 hover:text-[#00C9B7] transition-colors">
                      {settings.contactUs.phone2}
                    </a>
                  )}
                </div>
              </li>

              <li className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-[#00C9B7]">
                  <Mail size={14} />
                </div>
                <a href={`mailto:${settings.contactUs?.email || 'trekpremi01@gmail.com'}`} className="text-gray-300 hover:text-[#00C9B7] transition-colors text-xs font-medium truncate">
                  {settings.contactUs?.email || 'trekpremi01@gmail.com'}
                </a>
              </li>
            </ul>
          </motion.div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-white/10 pt-6 mt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs font-medium text-center sm:text-left">
              {settings.copyrightLine || `© ${currentYear} NextTour. All rights reserved.`}
            </p>

            <div className="flex flex-wrap justify-center gap-5 text-xs font-medium text-gray-500">
              <Link to="/contact" className="hover:text-[#00C9B7] transition-colors">Privacy Policy</Link>
              <Link to="/contact" className="hover:text-[#00C9B7] transition-colors">Terms of Service</Link>
              <Link to="/contact" className="hover:text-[#00C9B7] transition-colors">Cancellation Policy</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

