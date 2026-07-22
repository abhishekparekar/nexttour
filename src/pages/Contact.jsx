import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getTenantPath } from '../config/tenant';
import { motion } from 'framer-motion';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const contactPath = getTenantPath('contacts');
      await addDoc(collection(db, contactPath), {
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'new'
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Contact form error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: MapPin, title: 'Visit Us', desc: 'Sai Vihar Colony, Near Sai Mandir, MIDC, Ranjangaon Shenpunji, Waluj, MH 431001' },
    { icon: Phone, title: 'Call Us', desc: '+91 9156434444\n+91 7758998055' },
    { icon: Mail, title: 'Email Us', desc: 'trekpremi01@gmail.com' },
    { icon: Clock, title: 'Working Hours', desc: 'Mon - Sat: 9AM - 8PM\nSunday: 10AM - 6PM' }
  ];

  const inputClass = "w-full bg-[#f8f9fa] border-b-2 border-[#e5e5e5] px-4 py-4 text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#00C9B7] focus:bg-[#E6FAF8] transition-all duration-300 rounded-t-xl";

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <div className="relative h-[30vh] min-h-[250px] w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2000" 
          alt="Contact Us" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="absolute inset-0 flex items-center justify-center pt-16">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center px-4"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">Let's Talk Adventure</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light">
              Got a trek in mind? We are here to guide you every step of the way. Reach out to our experts.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-10 lg:py-12">
        
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 lg:gap-12 items-start">
          
          {/* Form Section */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="xl:col-span-3 bg-white"
          >
            <div className="mb-6">
              <span className="text-[#00C9B7] font-bold tracking-wider uppercase text-sm mb-2 block">Send a Message</span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#111] mb-2">We'd love to hear from you.</h2>
              <p className="text-[#555] text-sm leading-relaxed">Fill out the form below and our team will get back to you within 24 hours.</p>
            </div>

            {isSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#f8fffa] border border-[#d1fae5] rounded-3xl p-10 md:p-16 text-center"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-[#111] mb-3">Message Received!</h3>
                <p className="text-[#555] max-w-sm mx-auto">Thank you for reaching out. A member of our team will contact you shortly.</p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="mt-8 text-green-600 font-semibold hover:underline"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-medium">
                    <AlertCircle size={20} />
                    {error}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full bg-[#f8f9fa] border-b-2 border-[#e5e5e5] px-3 py-3 text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#00C9B7] focus:bg-[#E6FAF8] transition-all duration-300 rounded-t-lg text-sm" placeholder="Full Name *" />
                  </div>
                  <div>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-[#f8f9fa] border-b-2 border-[#e5e5e5] px-3 py-3 text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#00C9B7] focus:bg-[#E6FAF8] transition-all duration-300 rounded-t-lg text-sm" placeholder="Email Address *" />
                  </div>
                  <div className="md:col-span-2">
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-[#f8f9fa] border-b-2 border-[#e5e5e5] px-3 py-3 text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#00C9B7] focus:bg-[#E6FAF8] transition-all duration-300 rounded-t-lg text-sm" placeholder="Phone Number" />
                  </div>
                  <div className="md:col-span-2">
                    <input type="text" name="subject" required value={formData.subject} onChange={handleChange} className="w-full bg-[#f8f9fa] border-b-2 border-[#e5e5e5] px-3 py-3 text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#00C9B7] focus:bg-[#E6FAF8] transition-all duration-300 rounded-t-lg text-sm" placeholder="Subject *" />
                  </div>
                </div>
                
                <div>
                  <textarea name="message" required value={formData.message} onChange={handleChange} rows={4} className="w-full bg-[#f8f9fa] border-b-2 border-[#e5e5e5] px-3 py-3 text-[#111111] placeholder-[#9ca3af] focus:outline-none focus:border-[#00C9B7] focus:bg-[#E6FAF8] transition-all duration-300 rounded-t-lg text-sm resize-none" placeholder="How can we help you plan your next adventure? *" />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="group flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-[#111] text-white font-bold rounded-full hover:bg-[#00C9B7] hover:text-[#111] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                  {!isSubmitting && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            )}
          </motion.div>

          {/* Map Section */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="xl:col-span-2 h-full min-h-[300px] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] relative border border-[#f0f0f0]"
          >
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d120092.34863810168!2d75.21045435!3d19.827725!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdba2c1ce1248fd%3A0x2ce1120023a1050!2sWaluj%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </motion.div>

        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {contactInfo.map((info, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#f0f0f0] hover:-translate-y-1 transition-transform duration-300 group flex flex-col items-center text-center"
            >
              <div className="w-10 h-10 bg-[#00C9B7]/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#00C9B7] transition-colors duration-300">
                <info.icon className="w-5 h-5 text-[#00C9B7] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-[#111] font-bold text-base mb-1">{info.title}</h3>
              <p className="text-[#555] text-xs leading-relaxed whitespace-pre-line">
                {info.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contact;
