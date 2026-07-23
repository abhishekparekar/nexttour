import { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle, Phone, Mail, MapPin, Clock, Map, Upload } from 'lucide-react';
import { subscribeToContactSettings, saveContactSettings, uploadCompressedImage, DEFAULT_CONTACT_SETTINGS } from '../../firebase';

const AdminContactSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_CONTACT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = subscribeToContactSettings((data) => {
      if (data) setSettings(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleHeroUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingHero(true);
      const url = await uploadCompressedImage(file, `contact/${Date.now()}_${file.name}`, 200);
      setSettings(prev => ({ ...prev, heroImage: url }));
    } catch (err) {
      console.error(err);
      setError('Failed to upload image: ' + (err.message || err));
    } finally {
      setUploadingHero(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await saveContactSettings(settings);
      setMessage('Contact Page settings saved successfully!');
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setError('Failed to save contact settings: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00C9B7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Contact Page Management</h1>
          <p className="text-gray-500 text-xs mt-0.5">Edit contact phone numbers, email address, physical location, working hours, and Google Map link</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        
        {message && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm font-semibold">
            <CheckCircle size={18} />
            {message}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm font-semibold">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">

          {/* Hero Banner Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Phone size={18} className="text-[#00C9B7]" /> Hero Banner Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Hero Title</label>
                <input 
                  type="text"
                  value={settings.heroTitle || ''}
                  onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  placeholder="Let's Talk Adventure"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Hero Subtitle</label>
                <input 
                  type="text"
                  value={settings.heroSubtitle || ''}
                  onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  placeholder="Got a trek in mind?..."
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Hero Background Image</label>
                <div className="flex items-center gap-4">
                  {settings.heroImage && (
                    <img src={settings.heroImage} alt="Hero" className="w-20 h-14 object-cover rounded-xl border border-gray-200" />
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#00C9B7] transition-colors">
                    <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
                    {uploadingHero ? <Loader2 className="w-4 h-4 text-[#00C9B7] animate-spin" /> : <><Upload size={15} className="text-gray-400" /><span className="text-xs text-gray-500 font-bold">Upload Contact Hero Image</span></>}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Mail size={18} className="text-[#00C9B7]" /> Contact Information &amp; Working Hours
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Primary Phone Number</label>
                <input 
                  type="text"
                  value={settings.phone1 || ''}
                  onChange={(e) => setSettings({ ...settings, phone1: e.target.value })}
                  placeholder="+91 9156434444"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Secondary Phone Number</label>
                <input 
                  type="text"
                  value={settings.phone2 || ''}
                  onChange={(e) => setSettings({ ...settings, phone2: e.target.value })}
                  placeholder="+91 7758998055"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
                <input 
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="trekpremi01@gmail.com"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Office Location Address</label>
                <textarea 
                  rows={2}
                  value={settings.address || ''}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Full physical address..."
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7] resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Working Hours</label>
                <input 
                  type="text"
                  value={settings.workingHours || ''}
                  onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                  placeholder="Mon - Sat: 9AM - 8PM | Sunday: 10AM - 6PM"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>
            </div>
          </div>

          {/* Map Link Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Map size={18} className="text-[#00C9B7]" /> Google Maps Embed URL
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Google Maps Embed Link (`src` URL inside iframe)</label>
              <input 
                type="text"
                value={settings.mapUrl || ''}
                onChange={(e) => setSettings({ ...settings, mapUrl: e.target.value })}
                placeholder="https://www.google.com/maps/embed?pb=..."
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#00C9B7] hover:bg-[#00b5a3] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 active:scale-95"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              <span>Save Contact Page Settings</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminContactSettings;
