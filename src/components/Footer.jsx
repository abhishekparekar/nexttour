import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';

// WhatsApp icon (lucide doesn't have it, use inline SVG)
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Testimonials', path: '/testimonials' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: 'https://www.instagram.com/trekpremii?igsh=N3U3ZGVhNmExZDRq&utm_source=qr', label: 'Instagram' },
    { icon: WhatsAppIcon, href: 'https://wa.me/message/FH3CMQXFFIY2H1', label: 'WhatsApp' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer style={{ background: '#1a1a2e' }}>
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">

          {/* Brand */}
          <motion.div className="space-y-3 lg:col-span-1" initial={{ y: 20 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <Link to="/" className="flex items-center gap-3">
              <img src="/nexttour.jpeg" alt="NextTour Logo" className="h-10 w-auto object-contain bg-white rounded-lg p-1.5" />
            </Link>
            <p className="text-white/55 text-xs leading-relaxed">
              Your premium adventure partner. We craft unforgettable journeys through spectacular landscapes, ensuring every trek becomes a lifetime memory.
            </p>
            <div className="flex gap-2 pt-1">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:bg-[#00C9B7] hover:text-white transition-all duration-300"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon size={13} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div initial={{ y: 20 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
            <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-1.5">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-white/55 hover:text-[#00C9B7] transition-colors inline-flex items-center gap-2 text-xs">
                    <span className="w-1 h-1 bg-[#00C9B7] rounded-full flex-shrink-0" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div className="md:col-span-1 lg:col-span-2" initial={{ y: 20 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
            <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-[#00C9B7] mt-0.5 flex-shrink-0" />
                <p className="text-white/55 text-xs leading-relaxed">
                  Sai Vihar Colony, Near Sai Mandir, MIDC, Ranjangaon Shenpunji, Waluj, Wadgaon Kolhati, Maharashtra 431001
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-3.5 h-3.5 text-[#00C9B7] mt-0.5 flex-shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <a href="tel:+919156434444" className="text-white/55 hover:text-[#00C9B7] transition-colors text-xs">+91 9156434444</a>
                  <a href="tel:+917758998055" className="text-white/55 hover:text-[#00C9B7] transition-colors text-xs">+91 7758998055</a>
                </div>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-[#00C9B7] flex-shrink-0" />
                <a href="mailto:trekpremi01@gmail.com" className="text-white/55 hover:text-[#00C9B7] transition-colors text-xs">trekpremi01@gmail.com</a>
              </li>
            </ul>
          </motion.div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/35 text-xs">© {currentYear} NextTour. All rights reserved.</p>
            <div className="flex gap-5 text-xs">
              <a href="#" className="text-white/35 hover:text-[#00C9B7] transition-colors">Privacy Policy</a>
              <a href="#" className="text-white/35 hover:text-[#00C9B7] transition-colors">Terms of Service</a>
              <a href="#" className="text-white/35 hover:text-[#00C9B7] transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
