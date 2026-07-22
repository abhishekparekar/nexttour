import { useState, useEffect } from 'react';
import { Search, Loader2, Phone, MapPin, Trash2, Download, Calendar, ExternalLink, MessageSquare } from 'lucide-react';
import { subscribeToLeads, deleteLead } from '../../firebase';

const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Admin Leads: Setting up subscription...');
    const unsubscribe = subscribeToLeads((data) => {
      console.log('Admin Leads: Leads loaded:', data.length);
      setLeads(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteLead = async (phone, name) => {
    if (window.confirm(`Are you sure you want to delete lead details for ${name} (${phone})?`)) {
      try {
        await deleteLead(phone);
      } catch (err) {
        console.error('Failed to delete lead:', err);
        alert('Failed to delete lead. Please try again.');
      }
    }
  };

  const filteredLeads = leads.filter(lead => {
    const term = searchTerm.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(term) ||
      lead.phone?.includes(term) ||
      lead.city?.toLowerCase().includes(term) ||
      lead.lastDownloadedTripTitle?.toLowerCase().includes(term)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Stats calculation
  const totalLeads = leads.length;
  const uniqueCities = new Set(leads.map(l => l.city?.trim().toLowerCase()).filter(Boolean)).size;
  const recentLeadsCount = leads.filter(l => {
    if (!l.updatedAt) return false;
    const diffTime = Math.abs(new Date() - new Date(l.updatedAt));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2; // downloaded in the last 2 days
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12 text-gray-700">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Download className="w-7 h-7 text-primary-500" /> PDF Itinerary Leads
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">View and manage customers who downloaded trip PDFs</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
              <Download size={22} />
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900">{totalLeads}</span>
              <span className="block text-xs text-gray-500 font-medium">Total Downloads</span>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <MapPin size={22} />
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900">{uniqueCities}</span>
              <span className="block text-xs text-gray-500 font-medium">Unique Cities</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
              <Calendar size={22} />
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900">{recentLeadsCount}</span>
              <span className="block text-xs text-gray-500 font-medium">New (Last 48 Hrs)</span>
            </div>
          </div>
        </div>

        {/* Search & Data Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, city, or trip..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200 bg-gray-50/50">
                  <th className="p-6 font-semibold">Customer Details</th>
                  <th className="p-6 font-semibold">WhatsApp / Contact</th>
                  <th className="p-6 font-semibold">Last Downloaded Trip</th>
                  <th className="p-6 font-semibold">Date &amp; Time</th>
                  <th className="p-6 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors text-sm">
                    {/* Customer */}
                    <td className="p-4">
                      <div className="text-gray-900 font-bold text-[15px]">{lead.name}</div>
                      <div className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                        <MapPin size={12} className="text-gray-400" /> {lead.city}
                      </div>
                    </td>

                    {/* Contact details & click to WhatsApp */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-gray-900 font-semibold flex items-center gap-1.5">
                          <Phone size={13} className="text-gray-400" /> {lead.phone}
                        </span>
                        <a
                          href={`https://wa.me/91${lead.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-fit text-xs text-green-700 font-bold hover:bg-green-100 transition-colors flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-full border border-green-200"
                        >
                          <MessageSquare size={12} className="fill-green-700/10" /> Chat on WhatsApp
                        </a>
                      </div>
                    </td>

                    {/* Trip details */}
                    <td className="p-4">
                      <div className="max-w-[240px]">
                        {lead.lastDownloadedTripId ? (
                          <a
                            href={`/trip/${lead.lastDownloadedTripId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-900 font-semibold hover:text-primary-600 hover:underline transition-colors flex items-center gap-1"
                          >
                            {lead.lastDownloadedTripTitle || 'View Trip'} <ExternalLink size={12} className="flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </div>
                    </td>

                    {/* Update timestamps */}
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-900 font-semibold text-xs">{formatDate(lead.updatedAt)}</span>
                        {lead.createdAt && lead.createdAt !== lead.updatedAt && (
                          <span className="text-[10px] text-gray-500">First Download: {formatDate(lead.createdAt)}</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-6 text-center">
                      <button
                        onClick={() => handleDeleteLead(lead.phone, lead.name)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all border border-red-100"
                        title="Delete Lead"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredLeads.length === 0 && (
            <div className="text-center py-16">
              <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" strokeWidth={1.5} />
              <h3 className="text-lg font-semibold text-gray-900">No leads found</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1">
                {searchTerm ? 'Try adjusting your search query' : 'Leads will appear here when users download a trip itinerary PDF'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLeads;
