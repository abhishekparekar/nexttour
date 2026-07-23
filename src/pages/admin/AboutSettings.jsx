import { useState, useEffect } from 'react';
import { Save, Loader2, AlertCircle, CheckCircle, Info, Image, Upload, Plus, Trash2 } from 'lucide-react';
import { subscribeToAboutSettings, saveAboutSettings, uploadCompressedImage, DEFAULT_ABOUT_SETTINGS } from '../../firebase';

const AdminAboutSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_ABOUT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = subscribeToAboutSettings((data) => {
      if (data) setSettings(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleImageUpload = async (e, fieldKey, setUploading) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadCompressedImage(file, `about/${Date.now()}_${file.name}`, 200);
      setSettings(prev => ({ ...prev, [fieldKey]: url }));
    } catch (err) {
      console.error(err);
      setError('Failed to upload image: ' + (err.message || err));
    } finally {
      setUploading(false);
    }
  };

  const handleStatChange = (index, key, value) => {
    const updatedStats = [...(settings.stats || [])];
    updatedStats[index] = { ...updatedStats[index], [key]: value };
    setSettings({ ...settings, stats: updatedStats });
  };

  const handleValueChange = (index, key, value) => {
    const updatedValues = [...(settings.values || [])];
    updatedValues[index] = { ...updatedValues[index], [key]: value };
    setSettings({ ...settings, values: updatedValues });
  };

  const handleTeamMemberChange = (index, key, value) => {
    const updatedTeam = [...(settings.teamMembers || DEFAULT_ABOUT_SETTINGS.teamMembers)];
    updatedTeam[index] = { ...updatedTeam[index], [key]: value };
    setSettings({ ...settings, teamMembers: updatedTeam });
  };

  const handleTeamMemberImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const url = await uploadCompressedImage(file, `team/${Date.now()}_${file.name}`, 200);
      handleTeamMemberChange(index, 'image', url);
    } catch (err) {
      console.error(err);
      setError('Failed to upload member photo: ' + (err.message || err));
    }
  };

  const handleAddTeamMember = () => {
    const updatedTeam = [...(settings.teamMembers || DEFAULT_ABOUT_SETTINGS.teamMembers)];
    updatedTeam.push({ name: 'New Leader', role: 'Adventure Specialist', image: '/male.jpeg' });
    setSettings({ ...settings, teamMembers: updatedTeam });
  };

  const handleRemoveTeamMember = (index) => {
    const updatedTeam = [...(settings.teamMembers || DEFAULT_ABOUT_SETTINGS.teamMembers)];
    updatedTeam.splice(index, 1);
    setSettings({ ...settings, teamMembers: updatedTeam });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await saveAboutSettings(settings);
      setMessage('About Page settings saved successfully!');
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setError('Failed to save settings: ' + (err.message || err));
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
          <h1 className="text-lg font-bold text-gray-900">About Page Management</h1>
          <p className="text-gray-500 text-xs mt-0.5">Edit hero title, story, statistics, core values, and leadership team shown on the About Us page</p>
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
              <Info size={18} className="text-[#00C9B7]" /> Hero Banner Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Hero Title</label>
                <input 
                  type="text"
                  value={settings.heroTitle || ''}
                  onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  placeholder="Our Story"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Hero Subtitle</label>
                <input 
                  type="text"
                  value={settings.heroSubtitle || ''}
                  onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                  placeholder="Your trusted partner..."
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
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'heroImage', setUploadingHero)} className="hidden" />
                    {uploadingHero ? <Loader2 className="w-4 h-4 text-[#00C9B7] animate-spin" /> : <><Upload size={15} className="text-gray-400" /><span className="text-xs text-gray-500 font-bold">Upload Hero Image</span></>}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Our Story Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Image size={18} className="text-[#00C9B7]" /> Our Story &amp; Mission Section
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Section Badge</label>
                <input 
                  type="text"
                  value={settings.storyBadge || ''}
                  onChange={(e) => setSettings({ ...settings, storyBadge: e.target.value })}
                  placeholder="Who We Are"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Story Section Title</label>
                <input 
                  type="text"
                  value={settings.storyTitle || ''}
                  onChange={(e) => setSettings({ ...settings, storyTitle: e.target.value })}
                  placeholder="Where Adventure Meets Excellence"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Story Paragraph 1</label>
                <textarea 
                  rows={3}
                  value={settings.storyParagraph1 || ''}
                  onChange={(e) => setSettings({ ...settings, storyParagraph1: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7] resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Story Paragraph 2</label>
                <textarea 
                  rows={2}
                  value={settings.storyParagraph2 || ''}
                  onChange={(e) => setSettings({ ...settings, storyParagraph2: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7] resize-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Story Image</label>
                <div className="flex items-center gap-4">
                  {settings.storyImage && (
                    <img src={settings.storyImage} alt="Story" className="w-20 h-14 object-cover rounded-xl border border-gray-200" />
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#00C9B7] transition-colors">
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'storyImage', setUploadingStory)} className="hidden" />
                    {uploadingStory ? <Loader2 className="w-4 h-4 text-[#00C9B7] animate-spin" /> : <><Upload size={15} className="text-gray-400" /><span className="text-xs text-gray-500 font-bold">Upload Story Image</span></>}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Leadership Team Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Meet Our Leadership Team</h3>
                <p className="text-xs text-gray-500">Manage leadership section heading, members, roles, and profile photos</p>
              </div>
              <button
                type="button"
                onClick={handleAddTeamMember}
                className="px-3 py-1.5 bg-teal-50 text-[#00C9B7] hover:bg-[#00C9B7] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add Member</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Leadership Section Title</label>
                <input 
                  type="text"
                  value={settings.leadershipTitle || ''}
                  onChange={(e) => setSettings({ ...settings, leadershipTitle: e.target.value })}
                  placeholder="Meet Our Leadership"
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Leadership Section Subtitle</label>
                <input 
                  type="text"
                  value={settings.leadershipSubtitle || ''}
                  onChange={(e) => setSettings({ ...settings, leadershipSubtitle: e.target.value })}
                  placeholder="The experienced team driving NextTour's vision..."
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
                />
              </div>
            </div>

            {/* Team Members List */}
            <div className="space-y-4 pt-2">
              {(settings.teamMembers || DEFAULT_ABOUT_SETTINGS.teamMembers).map((member, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#00C9B7]">Leader #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTeamMember(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text"
                        value={member.name || ''}
                        onChange={(e) => handleTeamMemberChange(idx, 'name', e.target.value)}
                        placeholder="Name"
                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Role / Designation</label>
                      <input 
                        type="text"
                        value={member.role || ''}
                        onChange={(e) => handleTeamMemberChange(idx, 'role', e.target.value)}
                        placeholder="Founder & Lead Guide"
                        className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Profile Photo</label>
                      <div className="flex items-center gap-2">
                        <img src={member.image || '/male.jpeg'} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-gray-300 flex-shrink-0" />
                        <label className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded-xl text-[11px] font-bold text-gray-600 hover:border-[#00C9B7] cursor-pointer text-center truncate">
                          <span>Change Photo</span>
                          <input type="file" accept="image/*" onChange={(e) => handleTeamMemberImageUpload(e, idx)} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Key Statistics (4 Indicators)</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(settings.stats || DEFAULT_ABOUT_SETTINGS.stats).map((stat, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="text-xs font-bold text-[#00C9B7]">Indicator #{idx + 1}</div>
                  <input 
                    type="text"
                    value={stat.value || ''}
                    onChange={(e) => handleStatChange(idx, 'value', e.target.value)}
                    placeholder="e.g. 500+"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 font-bold"
                  />
                  <input 
                    type="text"
                    value={stat.label || ''}
                    onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                    placeholder="e.g. Treks Completed"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Core Values Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Core Values (4 Cards)</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(settings.values || DEFAULT_ABOUT_SETTINGS.values).map((val, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="text-xs font-bold text-[#00C9B7]">Value #{idx + 1}</div>
                  <input 
                    type="text"
                    value={val.title || ''}
                    onChange={(e) => handleValueChange(idx, 'title', e.target.value)}
                    placeholder="Title"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 font-bold"
                  />
                  <textarea 
                    rows={2}
                    value={val.description || ''}
                    onChange={(e) => handleValueChange(idx, 'description', e.target.value)}
                    placeholder="Description..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-700 resize-none"
                  />
                </div>
              ))}
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
              <span>Save About Page Settings</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminAboutSettings;
