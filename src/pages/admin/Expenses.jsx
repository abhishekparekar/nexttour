import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Loader2, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { subscribeToExpenses, addExpense, updateExpense, deleteExpense, subscribeToSchedules } from '../../firebase';

const AdminExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    scheduleId: '',
    category: 'vehicle',
    amount: '',
    date: '',
    notes: ''
  });

  useEffect(() => {
    const unsubExpenses = subscribeToExpenses((data) => setExpenses(data));
    const unsubSchedules = subscribeToSchedules((data) => {
      setSchedules(data);
      setLoading(false);
    });

    return () => {
      unsubExpenses();
      unsubSchedules();
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({
      scheduleId: schedules[0]?.id || '',
      category: 'vehicle',
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
      category: expense.category || 'vehicle',
      amount: expense.amount || '',
      date: expense.date || '',
      notes: expense.notes || ''
    });
    setError(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
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
      setError('Trip departure, Amount, and Date are required.');
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
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'vehicle', label: 'Vehicle / Transport' },
    { value: 'hotel', label: 'Hotel / Lodging' },
    { value: 'food', label: 'Food / Catering' },
    { value: 'guide', label: 'Tour Guide Fee' },
    { value: 'fuel', label: 'Fuel / Diesel' },
    { value: 'toll', label: 'Toll / Parking' },
    { value: 'other', label: 'Other Expenses' }
  ];

  const getCategoryLabel = (val) => categories.find(c => c.value === val)?.label || val;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-gray-900">Trip Expenses</h1>
          <p className="text-gray-600 text-xs mt-0.5">{expenses.length} records registered</p>
        </div>
        <button
          onClick={handleOpenAdd}
          disabled={schedules.length === 0}
          className="flex items-center gap-2 bg-[#00C9B7] hover:bg-[#00b3a2] text-white font-semibold py-2 px-3 rounded-lg text-xs transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} /> Record Expense
        </button>
      </div>

      <div className="p-4">
        {schedules.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl flex items-center gap-3">
            <AlertCircle size={20} className="flex-shrink-0" />
            <div>
              <h4 className="font-bold">No active scheduled departures found!</h4>
              <p className="text-xs mt-0.5">You must first schedule a departure under "Trips / Schedule" before adding trip-wise expenses.</p>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by package, note, etc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-600 text-xs font-bold uppercase tracking-wide border-b border-gray-200 bg-gray-50/50">
                  <th className="px-3 py-2">Trip / Departure</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="px-3 py-2">Notes</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(expense => (
                  <tr key={expense.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 align-middle">
                      <div className="text-gray-900 font-bold text-[13px]">{expense.tripTitle}</div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full capitalize">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex items-center gap-1.5 text-gray-800 text-xs font-semibold">
                        <Calendar size={13} className="text-gray-400" /> {expense.date}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle text-right text-gray-900 font-bold text-[13px]">
                      ₹{expense.amount?.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 align-middle text-gray-700 text-xs truncate max-w-[200px]">{expense.notes || 'N/A'}</td>
                    <td className="px-3 py-2 align-middle">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenEdit(expense)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors">
                          <Edit2 size={15} className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors">
                          <Trash2 size={15} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block lg:hidden divide-y divide-gray-100">
            {filteredExpenses.map(expense => (
              <div key={expense.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 text-[14px]">{expense.tripTitle}</h4>
                    <p className="text-gray-600 text-xs mt-0.5">Date: {expense.date}</p>
                  </div>
                  <span className="bg-primary-50 text-primary-700 text-xs font-bold px-2.5 py-0.5 rounded-full capitalize border border-primary-200">
                    {expense.category}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="text-red-600">₹{expense.amount?.toLocaleString()}</span>
                  </div>
                  {expense.notes && (
                    <div className="border-t border-gray-200/65 pt-1.5 mt-1.5 text-gray-600">
                      <strong>Notes:</strong> {expense.notes}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(expense)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-gray-900 font-semibold mb-1">No expense records found</h3>
              <p className="text-gray-600 text-sm">Add expenses to track financial status and trip profitability.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-lg">
                {editingExpense ? 'Edit Expense Details' : 'Record New Expense'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Associate Trip Departure *</label>
                <select
                  value={formData.scheduleId}
                  onChange={(e) => setFormData({ ...formData, scheduleId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white cursor-pointer"
                >
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>{s.tripTitle} ({s.departureDate})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Expense Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Expense Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-bold uppercase tracking-wider mb-2">Description / Notes</label>
                <textarea
                  placeholder="Details like vendor name, bill number, description..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white h-20 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-white border border-gray-300 text-gray-700 font-bold py-2.5 px-5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
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
