import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, MapPin, Loader2, Download } from 'lucide-react';

const LeadCaptureModal = ({ isOpen, onClose, onSubmit, tripTitle }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load from localStorage if already saved
  useEffect(() => {
    if (isOpen) {
      const savedName = localStorage.getItem('lead_name') || '';
      const savedPhone = localStorage.getItem('lead_phone') || '';
      const savedCity = localStorage.getItem('lead_city') || '';
      setName(savedName);
      setPhone(savedPhone);
      setCity(savedCity);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanCity = city.trim();

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }

    // Standard 10 digit phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    if (!cleanCity) {
      setError('Please enter your city.');
      return;
    }

    setSubmitting(true);
    try {
      // Save to localStorage for future downloads
      localStorage.setItem('lead_name', cleanName);
      localStorage.setItem('lead_phone', cleanPhone);
      localStorage.setItem('lead_city', cleanCity);

      // Call parent submit handler
      await onSubmit({ name: cleanName, phone: cleanPhone, city: cleanCity });
      onClose();
    } catch (err) {
      console.error('Error saving lead:', err);
      setError('Failed to save details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                  <Download size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#111] leading-none">Download PDF</h2>
                  <p className="text-xs text-gray-500 mt-1">Please fill in your details to get the PDF.</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 self-start"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {tripTitle && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trip Itinerary</span>
                  <span className="block text-sm font-bold text-gray-700 leading-snug">{tripTitle}</span>
                </div>
              )}

              {/* Name Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#111] focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Phone Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit WhatsApp number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    disabled={submitting}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#111] focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* City Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={submitting}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#111] focus:outline-none focus:border-green-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs font-medium text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-[#111] hover:bg-black text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving details...
                  </>
                ) : (
                  <>
                    Submit &amp; Download PDF
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default LeadCaptureModal;
