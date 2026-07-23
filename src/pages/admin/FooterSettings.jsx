import { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle, Share2, Phone, Mail, MapPin, Tag, ExternalLink } from 'lucide-react';
import { subscribeToFooterSettings, saveFooterSettings, DEFAULT_FOOTER_SETTINGS } from '../../firebase';
import { Link } from 'react-router-dom';

const AdminFooterSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_FOOTER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = subscribeToFooterSettings((data) => {
      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data,
          socialLinks: { ...prev.socialLinks, ...(data.socialLinks || {}) },
          contactUs: { ...prev.contactUs, ...(data.contactUs || {}) }
        }));
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleChangeSocial = (key, value) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || {}),
        [key]: value
      }
    }));
  };

  const handleChangeContact = (key, value) => {
    setSettings(prev => ({
      ...prev,
      contactUs: {
        ...(prev.contactUs || {}),
        [key]: value
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await saveFooterSettings(settings);
      setMessage('Footer settings saved successfully!');
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setError('Failed to save footer settings: ' + (err.message || err));
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
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Footer &amp; Website Settings</h1>
          <p className="text-gray-500 text-xs mt-0.5">Manage social media links, contact info, copyright line, and category links</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        
        {message && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 text-sm font-semibold animate-in fade-in duration-200">
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

          {/* Social Media Links Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#00C9B7]">
                <Share2 size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Social Media Links</h3>
                <p className="text-xs text-gray-500">URLs for social media icons displayed in the footer</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Instagram URL</label>
                <input 
                  type="text"
                  value={settings.socialLinks?.instagram || ''}
                  onChange={(e) => handleChangeSocial('instagram', e.target.value)}
                  placeholder="https://www.instagram.com/yourprofile"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">WhatsApp Link / Number</label>
                <input 
                  type="text"
                  value={settings.socialLinks?.whatsapp || ''}
                  onChange={(e) => handleChangeSocial('whatsapp', e.target.value)}
                  placeholder="https://wa.me/919970280549"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Facebook URL</label>
                <input 
                  type="text"
                  value={settings.socialLinks?.facebook || ''}
                  onChange={(e) => handleChangeSocial('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">YouTube URL</label>
                <input 
                  type="text"
                  value={settings.socialLinks?.youtube || ''}
                  onChange={(e) => handleChangeSocial('youtube', e.target.value)}
                  placeholder="https://youtube.com/@channel"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>
            </div>
          </div>

          {/* Contact Us Settings Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#00C9B7]">
                <Phone size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Contact Us Information</h3>
                <p className="text-xs text-gray-500">Phone numbers, email address, and office location displayed in footer</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-[#00C9B7]" /> Primary Phone Number
                </label>
                <input 
                  type="text"
                  value={settings.contactUs?.phone1 || ''}
                  onChange={(e) => handleChangeContact('phone1', e.target.value)}
                  placeholder="+91 9156434444"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-[#00C9B7]" /> Secondary Phone Number
                </label>
                <input 
                  type="text"
                  value={settings.contactUs?.phone2 || ''}
                  onChange={(e) => handleChangeContact('phone2', e.target.value)}
                  placeholder="+91 7758998055"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-[#00C9B7]" /> Email Address
                </label>
                <input 
                  type="email"
                  value={settings.contactUs?.email || ''}
                  onChange={(e) => handleChangeContact('email', e.target.value)}
                  placeholder="trekpremi01@gmail.com"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#00C9B7]" /> Office Location Address
                </label>
                <textarea 
                  rows={2}
                  value={settings.contactUs?.address || ''}
                  onChange={(e) => handleChangeContact('address', e.target.value)}
                  placeholder="Enter full office address..."
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Copyright Line Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#00C9B7]">
                <Tag size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Copyright Line</h3>
                <p className="text-xs text-gray-500">Custom copyright text line shown at the bottom of the footer</p>
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Copyright Text</label>
              <input 
                type="text"
                value={settings.copyrightLine || ''}
                onChange={(e) => setSettings({ ...settings, copyrightLine: e.target.value })}
                placeholder="© 2026 NextTour. All rights reserved."
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
              />
            </div>
          </div>

          {/* Manage Categories Shortcut Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#00C9B7]">
                <Tag size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Categories (Minimum 6 Display)</h3>
                <p className="text-xs text-gray-500">Categories in the footer are automatically loaded live from your Categories database</p>
              </div>
            </div>

            <Link
              to="/admin/categories"
              className="px-4 py-2 bg-gray-100 hover:bg-[#00C9B7] hover:text-white text-gray-700 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5"
            >
              <span>Manage Categories</span>
              <ExternalLink size={14} />
            </Link>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#00C9B7] hover:bg-[#00b5a3] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Footer Settings</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminFooterSettings;
