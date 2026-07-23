import { useState, useEffect } from 'react';
import { Search, Loader2, Phone, Mail, MessageSquare, Trash2, Calendar, CheckCircle2, Clock, MessageCircle, AlertCircle } from 'lucide-react';
import { subscribeToContacts, deleteContact, updateContactStatus } from '../../firebase';

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToContacts((data) => {
      setInquiries(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete inquiry from ${name}?`)) {
      try {
        await deleteContact(id);
        if (selectedInquiry?.id === id) setSelectedInquiry(null);
      } catch (err) {
        console.error('Failed to delete inquiry:', err);
        alert('Failed to delete inquiry.');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateContactStatus(id, newStatus);
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

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

  const filteredInquiries = inquiries.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (
      item.name?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.phone?.includes(term) ||
      item.subject?.toLowerCase().includes(term) ||
      item.message?.toLowerCase().includes(term)
    );
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter || (!item.status && statusFilter === 'new');
    return matchesSearch && matchesStatus;
  });

  const totalInquiries = inquiries.length;
  const newCount = inquiries.filter(i => !i.status || i.status === 'new').length;
  const contactedCount = inquiries.filter(i => i.status === 'contacted').length;
  const resolvedCount = inquiries.filter(i => i.status === 'resolved').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00C9B7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12 text-gray-700">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-[#00C9B7]" /> Contact Form Inquiries
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">Manage messages and inquiries submitted by visitors from the Contact Us page</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center text-[#00C9B7]">
              <MessageSquare size={20} />
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900">{totalInquiries}</span>
              <span className="block text-xs text-gray-500 font-medium">Total Inquiries</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Clock size={20} />
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900">{newCount}</span>
              <span className="block text-xs text-gray-500 font-medium">New / Unread</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Phone size={20} />
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900">{contactedCount}</span>
              <span className="block text-xs text-gray-500 font-medium">In Progress</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="block text-2xl font-black text-gray-900">{resolvedCount}</span>
              <span className="block text-xs text-gray-500 font-medium">Resolved</span>
            </div>
          </div>
        </div>

        {/* Data Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Controls Bar */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7] focus:ring-1 focus:ring-[#00C9B7]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['all', 'new', 'contacted', 'resolved'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                    statusFilter === status
                      ? 'bg-[#00C9B7] text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Inquiries Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Customer Info</th>
                  <th className="p-4">Subject &amp; Message</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Submitted At</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInquiries.map((inquiry) => {
                  const isNew = !inquiry.status || inquiry.status === 'new';
                  const isResolved = inquiry.status === 'resolved';

                  return (
                    <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors text-xs">
                      
                      {/* Customer Info */}
                      <td className="p-4">
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          {isNew && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" title="New Inquiry" />}
                          <span>{inquiry.name}</span>
                        </div>
                        
                        <div className="mt-1 space-y-1">
                          {inquiry.phone && (
                            <div className="flex items-center gap-2">
                              <a href={`tel:${inquiry.phone.replace(/\s+/g, '')}`} className="text-gray-600 hover:text-[#00C9B7] flex items-center gap-1">
                                <Phone size={12} className="text-gray-400" />
                                <span>{inquiry.phone}</span>
                              </a>

                              <a
                                href={`https://wa.me/91${inquiry.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-full font-bold text-[10px] flex items-center gap-1 border border-green-200"
                                title="Chat on WhatsApp"
                              >
                                WhatsApp
                              </a>
                            </div>
                          )}

                          {inquiry.email && (
                            <a href={`mailto:${inquiry.email}`} className="text-gray-500 hover:text-[#00C9B7] flex items-center gap-1">
                              <Mail size={12} className="text-gray-400" />
                              <span>{inquiry.email}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Subject & Message */}
                      <td className="p-4 max-w-xs sm:max-w-md">
                        {inquiry.subject && (
                          <div className="font-bold text-gray-900 mb-1">{inquiry.subject}</div>
                        )}
                        <p className="text-gray-600 line-clamp-2 text-xs leading-relaxed">
                          {inquiry.message || 'No message content.'}
                        </p>
                        {inquiry.message && inquiry.message.length > 80 && (
                          <button 
                            onClick={() => setSelectedInquiry(inquiry)}
                            className="text-[11px] font-bold text-[#00C9B7] hover:underline mt-1 block"
                          >
                            Read Full Message →
                          </button>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="p-4">
                        <select
                          value={inquiry.status || 'new'}
                          onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                            isNew 
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isResolved
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <option value="new">🟡 New</option>
                          <option value="contacted">🔵 Contacted</option>
                          <option value="resolved">🟢 Resolved</option>
                        </select>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-gray-500 font-medium whitespace-nowrap">
                        {formatDate(inquiry.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(inquiry.id, inquiry.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Delete Inquiry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredInquiries.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <h3 className="text-sm font-bold text-gray-900">No contact inquiries found</h3>
              <p className="text-xs text-gray-500 mt-1">
                {searchTerm ? 'Try adjusting your search query' : 'Messages submitted on the Contact page will appear here live'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* View Full Message Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedInquiry.name}</h3>
                <p className="text-xs text-gray-500">{formatDate(selectedInquiry.createdAt)}</p>
              </div>
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {selectedInquiry.subject && (
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Subject</span>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">{selectedInquiry.subject}</p>
                </div>
              )}

              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Message</span>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-800 leading-relaxed mt-1 whitespace-pre-wrap">
                  {selectedInquiry.message || 'No message body provided.'}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {selectedInquiry.phone && (
                  <a
                    href={`https://wa.me/91${selectedInquiry.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </a>
                )}
                {selectedInquiry.email && (
                  <a
                    href={`mailto:${selectedInquiry.email}`}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                  >
                    <Mail size={13} />
                    <span>Email</span>
                  </a>
                )}
              </div>

              <button
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInquiries;
