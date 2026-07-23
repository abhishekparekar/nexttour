import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Loader2, Calendar, CreditCard, AlertCircle, TrendingUp, TrendingDown, Printer, FileText } from 'lucide-react';
import { subscribeToExpenses, addExpense, updateExpense, deleteExpense, subscribeToSchedules, subscribeToBookings } from '../../firebase';
import { EXPENSE_CATEGORIES, getCategoryLabel, calculateTripFinances, formatCurrency } from '../../utils/bookingUtils';
import { printTripFinancialReport } from '../../utils/printTemplates';

const AdminExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedScheduleFilter, setSelectedScheduleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    scheduleId: '',
    category: 'diesel',
    amount: '',
    date: '',
    notes: ''
  });

  useEffect(() => {
    const unsubExpenses = subscribeToExpenses((data) => setExpenses(data));
    const unsubBookings = subscribeToBookings((data) => setBookings(data));
    const unsubSchedules = subscribeToSchedules((data) => {
      setSchedules(data);
      setLoading(false);
    });

    return () => {
      unsubExpenses();
      unsubBookings();
      unsubSchedules();
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({
      scheduleId: schedules[0]?.id || '',
      category: 'diesel',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      scheduleId: expense.scheduleId || '',
      category: expense.category || 'diesel',
      amount: expense.amount || '',
      date: expense.date || '',
      notes: expense.notes || ''
    });
    setError(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      try {
        await deleteExpense(id);
      } catch (err) {
        setError('Failed to delete expense record');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.scheduleId || !formData.amount || !formData.date) {
      setError('Trip departure schedule, Amount, and Date are required.');
      return;
    }

    try {
      const selectedSchedule = schedules.find(s => s.id === formData.scheduleId);
      const data = {
        ...formData,
        tripTitle: selectedSchedule ? `${selectedSchedule.tripTitle} (${selectedSchedule.departureDate})` : 'Unknown Trip',
        amount: Number(formData.amount)
      };

      if (editingExpense) {
        await updateExpense(editingExpense.id, data);
      } else {
        await addExpense(data);
      }
      setShowModal(false);
    } catch (err) {
      setError('Failed to save expense details.');
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.tripTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    const matchesSchedule = selectedScheduleFilter === 'all' || e.scheduleId === selectedScheduleFilter;
    return matchesSearch && matchesCategory && matchesSchedule;
  });

  // Calculate current selected trip profitability audit
  const activeScheduleObj = schedules.find(s => s.id === selectedScheduleFilter) || schedules[0];
  const activeTripFinances = activeScheduleObj ? calculateTripFinances(activeScheduleObj, bookings, expenses) : null;

  // Global total expense
  const grandTotalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00C9B7] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Trip Expenses & Profit Accounting</h1>
          <p className="text-gray-600 text-xs mt-0.5">
            {expenses.length} records registered &bull; Total Spent: <strong className="text-red-600">{formatCurrency(grandTotalExpenses)}</strong>
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          disabled={schedules.length === 0}
          className="flex items-center gap-1.5 bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Plus size={16} /> Record Trip Expense
        </button>
      </div>

      <div className="p-4 space-y-4">
        {schedules.length === 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl flex items-center gap-3 text-xs font-semibold">
            <AlertCircle size={20} className="flex-shrink-0 text-yellow-600" />
            <div>
              <h4 className="font-bold">No departure schedules active!</h4>
              <p className="text-gray-600 mt-0.5">Please create a scheduled trip departure under "Schedules" before logging expenses.</p>
            </div>
          </div>
        )}

        {/* Live Trip Profit / Loss Widget */}
        {activeTripFinances && (
          <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">TRIP PROFIT / LOSS AUDIT</span>
                <span className="font-bold text-gray-900 text-sm">{activeTripFinances.tripTitle} ({activeTripFinances.departureDate})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printTripFinancialReport(activeScheduleObj, activeTripFinances)}
                  className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-1.5 px-3 rounded-lg text-xs border border-gray-200 transition-all cursor-pointer"
                >
                  <Printer size={14} /> Download Trip Profit Audit PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Total Booked Value</span>
                <span className="block font-black text-gray-900 text-sm mt-1">{formatCurrency(activeTripFinances.totalBookedValue)}</span>
                <span className="text-[10px] text-gray-500">{activeTripFinances.bookingsCount} Bookings ({activeTripFinances.travelersCount} Pax)</span>
              </div>

              <div className="bg-green-50/40 border border-green-200/60 rounded-xl p-3 text-center">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-green-600">Revenue Collection</span>
                <span className="block font-black text-green-700 text-sm mt-1">{formatCurrency(activeTripFinances.passengerRevenueCollection)}</span>
                <span className="text-[10px] text-green-600 font-semibold">Actual Received</span>
              </div>

              <div className="bg-red-50/40 border border-red-200/60 rounded-xl p-3 text-center">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-red-600">Total Trip Expenses</span>
                <span className="block font-black text-red-700 text-sm mt-1">{formatCurrency(activeTripFinances.totalExpenses)}</span>
                <span className="text-[10px] text-red-600 font-semibold">Diesel, Water, Medical, Tickets...</span>
              </div>

              <div className={`border rounded-xl p-3 text-center ${
                activeTripFinances.isProfit 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}>
                <div className="flex items-center justify-center gap-1">
                  {activeTripFinances.isProfit ? <TrendingUp size={14} className="text-emerald-600" /> : <TrendingDown size={14} className="text-rose-600" />}
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider">
                    {activeTripFinances.isProfit ? 'NET PROFIT' : 'NET LOSS'}
                  </span>
                </div>
                <span className="block font-black text-base mt-0.5">{formatCurrency(activeTripFinances.netProfitLoss)}</span>
                <span className="text-[10px] font-bold">
                  {activeTripFinances.isProfit ? `${activeTripFinances.profitMarginPercent}% Margin` : 'Expense > Revenue'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses by trip name, vendor, note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={selectedScheduleFilter}
              onChange={(e) => setSelectedScheduleFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] font-semibold cursor-pointer"
            >
              <option value="all">All Trip Departures</option>
              {schedules.map(s => (
                <option key={s.id} value={s.id}>{s.tripTitle} ({s.departureDate})</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expenses List / Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-600 text-xs font-bold uppercase tracking-wide border-b border-gray-200 bg-gray-50/50">
                  <th className="px-4 py-3">Trip Departure</th>
                  <th className="px-4 py-3">Expense Category</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount Paid</th>
                  <th className="px-4 py-3">Notes & Details</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(expense => (
                  <tr key={expense.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <div className="text-gray-900 font-bold text-xs">{expense.tripTitle}</div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                        {getCategoryLabel(expense.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-1 text-gray-700 text-xs font-semibold">
                        <Calendar size={12} className="text-gray-400" /> {expense.date}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-right text-red-600 font-extrabold text-xs">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-4 py-3 align-middle text-gray-600 text-xs max-w-[250px] truncate">
                      {expense.notes || 'N/A'}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleOpenEdit(expense)} 
                          className="p-1.5 text-gray-400 hover:text-[#00C9B7] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(expense.id)} 
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block lg:hidden divide-y divide-gray-100">
            {filteredExpenses.map(expense => (
              <div key={expense.id} className="p-4 space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">{expense.tripTitle}</h4>
                    <p className="text-gray-500 text-[11px]">Date: {expense.date}</p>
                  </div>
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {getCategoryLabel(expense.category)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1 border border-gray-100">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="text-red-600">{formatCurrency(expense.amount)}</span>
                  </div>
                  {expense.notes && (
                    <div className="border-t border-gray-200/60 pt-1 mt-1 text-gray-600">
                      <strong>Notes:</strong> {expense.notes}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(expense)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="text-gray-800 font-bold text-xs mb-1">No expense records found</h3>
              <p className="text-gray-500 text-xs">Record diesel, petrol, tickets, water, and guide allowances to track exact trip profit/loss.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-sm">
                {editingExpense ? 'Edit Expense Record' : 'Log New Trip Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Trip Departure *</label>
                <select
                  value={formData.scheduleId}
                  onChange={(e) => setFormData({ ...formData, scheduleId: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] cursor-pointer"
                >
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>{s.tripTitle} ({s.departureDate})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7] cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 2500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#00C9B7]"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-1">Description / Vendor Notes</label>
                <textarea
                  placeholder="e.g. 50 Ltr Diesel fuel pump, Water bottle crates, Entry pass..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7] h-20 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-xl text-xs hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-2 px-5 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  {editingExpense ? 'Save Changes' : 'Save Expense Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenses;
