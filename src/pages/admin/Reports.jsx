import { useState, useEffect, useMemo } from 'react';
import { subscribeToBookings, subscribeToExpenses, subscribeToSchedules } from '../../firebase';
import { useCachedTrips } from '../../firebaseCache';
import { formatCurrency, exportToCSV, EXPENSE_CATEGORIES, getCategoryLabel, calculateTripSeatAvailability } from '../../utils/bookingUtils';
import { printTripFinancialReport } from '../../utils/printTemplates';
import {
  Loader2, TrendingUp, TrendingDown, DollarSign, Wallet, FileText,
  Calendar, Download, Printer, Search, X, Eye, MapPin, Users, Phone,
  UserCheck, BarChart2, Filter, ChevronDown
} from 'lucide-react';

// ---- Helper: Month Label ----
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const getMonthKey = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
};

const monthLabel = (key) => {
  if (!key) return '';
  const [yr, mo] = key.split('-');
  return `${MONTHS[parseInt(mo)-1]} ${yr}`;
};

// ---- Main Component ----
const AdminReports = () => {
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trip'); // 'trip' | 'month'

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrip, setSelectedTrip] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Modals
  const [passengerModal, setPassengerModal] = useState(null);
  const [auditModal, setAuditModal] = useState(null);

  useEffect(() => {
    const unsubBookings = subscribeToBookings((d) => { setBookings(d || []); setLoading(false); });
    const unsubExpenses = subscribeToExpenses((d) => setExpenses(d || []));
    const unsubSchedules = subscribeToSchedules((d) => setSchedules(d || []));
    const unsubTrips = useCachedTrips(() => {});
    return () => { unsubBookings(); unsubExpenses(); unsubSchedules(); unsubTrips(); };
  }, []);

  // --- Unique Trip Titles ---
  const uniqueTripTitles = useMemo(() => {
    const s = new Set();
    bookings.forEach(b => { if (b.tripName) s.add(b.tripName); });
    schedules.forEach(s2 => { if (s2.tripTitle || s2.title) s.add(s2.tripTitle || s2.title); });
    return Array.from(s).sort();
  }, [bookings, schedules]);

  // --- Unique Departure Dates for selected trip ---
  const uniqueDates = useMemo(() => {
    const s = new Set();
    bookings
      .filter(b => selectedTrip === 'all' || b.tripName === selectedTrip)
      .forEach(b => { if (b.selectedDate) s.add(b.selectedDate); });
    return Array.from(s).sort();
  }, [bookings, selectedTrip]);

  // --- Unique Month Keys ---
  const uniqueMonths = useMemo(() => {
    const s = new Set();
    bookings.forEach(b => {
      const k = getMonthKey(b.createdAt || b.selectedDate);
      if (k) s.add(k);
    });
    return Array.from(s).sort().reverse();
  }, [bookings]);

  // --- Apply base filters to bookings & expenses ---
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchTrip = selectedTrip === 'all' || b.tripName === selectedTrip;
      const matchDate = selectedDate === 'all' || b.selectedDate === selectedDate;
      const matchMonth = selectedMonth === 'all' || getMonthKey(b.createdAt || b.selectedDate) === selectedMonth;
      const q = searchTerm.toLowerCase();
      const matchSearch = !q || (b.tripName || '').toLowerCase().includes(q) || (b.name || '').toLowerCase().includes(q);
      return matchTrip && matchDate && matchMonth && matchSearch && b.status !== 'cancelled';
    });
  }, [bookings, selectedTrip, selectedDate, selectedMonth, searchTerm]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchTrip = selectedTrip === 'all' || (e.tripTitle || '').toLowerCase().includes((selectedTrip || '').toLowerCase());
      const matchDate = selectedDate === 'all' || e.date === selectedDate;
      const matchMonth = selectedMonth === 'all' || getMonthKey(e.date || e.createdAt) === selectedMonth;
      return matchTrip && matchDate && matchMonth;
    });
  }, [expenses, selectedTrip, selectedDate, selectedMonth]);

  // --- Global KPI Totals ---
  const kpi = useMemo(() => {
    const totalBooked = filteredBookings.reduce((s, b) => s + (Number(b.amount) || 0), 0);
    const totalCollected = filteredBookings.reduce((s, b) => s + (Number(b.paidAmount) || 0), 0);
    const totalPending = Math.max(0, totalBooked - totalCollected);
    const totalExpenses = filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netProfit = totalCollected - totalExpenses;
    return { totalBooked, totalCollected, totalPending, totalExpenses, netProfit };
  }, [filteredBookings, filteredExpenses]);

  // =====================================================
  // TAB 1: TRIP-WISE P&L ROWS (one row per unique trip)
  // =====================================================
  const tripRows = useMemo(() => {
    return uniqueTripTitles
      .filter(title => selectedTrip === 'all' || title === selectedTrip)
      .filter(title => !searchTerm || title.toLowerCase().includes(searchTerm.toLowerCase()))
      .map(title => {
        const titleLower = title.toLowerCase();
        const tripBookings = filteredBookings.filter(b => (b.tripName || '').toLowerCase() === titleLower);
        const tripExpenses = filteredExpenses.filter(e => (e.tripTitle || '').toLowerCase().includes(titleLower));

        const scheduleObj = schedules.find(s => (s.tripTitle || s.title || '').toLowerCase().includes(titleLower));
        const seatInfo = calculateTripSeatAvailability(scheduleObj || { capacity: 15 }, tripBookings);

        const totalBookings = tripBookings.length;
        const totalPax = tripBookings.reduce((s, b) => s + (Number(b.travelers) || 1), 0);
        const totalBooked = tripBookings.reduce((s, b) => s + (Number(b.amount) || 0), 0);
        const totalCollected = tripBookings.reduce((s, b) => s + (Number(b.paidAmount) || 0), 0);
        const pendingDue = Math.max(0, totalBooked - totalCollected);
        const totalExpensesAmt = tripExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const netPL = totalCollected - totalExpensesAmt;
        const margin = totalCollected > 0 ? ((netPL / totalCollected) * 100).toFixed(1) : 0;

        return {
          title, seatInfo, tripBookings, tripExpenses,
          totalBookings, totalPax, totalBooked, totalCollected,
          pendingDue, totalExpensesAmt, netPL, margin,
          isProfit: netPL >= 0
        };
      })
      .filter(r => r.totalBookings > 0 || r.totalExpensesAmt > 0);
  }, [uniqueTripTitles, filteredBookings, filteredExpenses, schedules, selectedTrip, searchTerm]);

  // =====================================================
  // TAB 2: MONTH-WISE P&L ROWS
  // =====================================================
  const monthRows = useMemo(() => {
    const allMonths = selectedMonth !== 'all' ? [selectedMonth] : uniqueMonths;
    return allMonths.map(mk => {
      const mBookings = bookings.filter(b => {
        const k = getMonthKey(b.createdAt || b.selectedDate);
        const matchTrip = selectedTrip === 'all' || b.tripName === selectedTrip;
        return k === mk && matchTrip && b.status !== 'cancelled';
      });
      const mExpenses = expenses.filter(e => {
        const k = getMonthKey(e.date || e.createdAt);
        const matchTrip = selectedTrip === 'all' || (e.tripTitle || '').toLowerCase().includes((selectedTrip || '').toLowerCase());
        return k === mk && matchTrip;
      });

      const totalBookings = mBookings.length;
      const totalPax = mBookings.reduce((s, b) => s + (Number(b.travelers) || 1), 0);
      const totalBooked = mBookings.reduce((s, b) => s + (Number(b.amount) || 0), 0);
      const totalCollected = mBookings.reduce((s, b) => s + (Number(b.paidAmount) || 0), 0);
      const pendingDue = Math.max(0, totalBooked - totalCollected);
      const totalExpensesAmt = mExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const netPL = totalCollected - totalExpensesAmt;
      const margin = totalCollected > 0 ? ((netPL / totalCollected) * 100).toFixed(1) : 0;

      // Unique trips this month
      const tripsSet = new Set(mBookings.map(b => b.tripName).filter(Boolean));

      return {
        monthKey: mk, label: monthLabel(mk),
        totalBookings, totalPax, tripsCount: tripsSet.size,
        totalBooked, totalCollected, pendingDue,
        totalExpensesAmt, netPL, margin,
        isProfit: netPL >= 0,
        mBookings, mExpenses
      };
    }).filter(r => r.totalBookings > 0 || r.totalExpensesAmt > 0);
  }, [uniqueMonths, bookings, expenses, selectedTrip, selectedMonth]);

  // =====================================================
  // Expense category breakdown
  // =====================================================
  const categoryTotals = useMemo(() => {
    return EXPENSE_CATEGORIES.map(cat => {
      const total = filteredExpenses.filter(e => e.category === cat.value).reduce((s, e) => s + (Number(e.amount) || 0), 0);
      return { ...cat, total };
    }).filter(c => c.total > 0);
  }, [filteredExpenses]);

  const handleExportCSV = () => {
    if (activeTab === 'trip') {
      const rows = tripRows.map(r => ({
        'Trip Package': r.title,
        'Total Bookings': r.totalBookings,
        'Passengers': r.totalPax,
        'Seats Left': r.seatInfo.remainingSeats,
        'Total Booked Value': r.totalBooked,
        'Revenue Collected': r.totalCollected,
        'Pending Due': r.pendingDue,
        'Trip Expenses': r.totalExpensesAmt,
        'Net Profit/Loss': r.netPL,
        'Margin %': r.margin + '%',
        'Status': r.isProfit ? 'PROFIT' : 'LOSS'
      }));
      const headers = Object.keys(rows[0] || {});
      exportToCSV(`TripWise_PL_Report_${Date.now()}.csv`, rows, headers);
    } else {
      const rows = monthRows.map(r => ({
        'Month': r.label,
        'Trips Count': r.tripsCount,
        'Total Bookings': r.totalBookings,
        'Passengers': r.totalPax,
        'Revenue Collected': r.totalCollected,
        'Pending Due': r.pendingDue,
        'Trip Expenses': r.totalExpensesAmt,
        'Net Profit/Loss': r.netPL,
        'Margin %': r.margin + '%',
        'Status': r.isProfit ? 'PROFIT' : 'LOSS'
      }));
      const headers = Object.keys(rows[0] || {});
      exportToCSV(`MonthWise_PL_Report_${Date.now()}.csv`, rows, headers);
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
    <div className="bg-gray-50 min-h-screen">

      {/* ── Top Header ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-extrabold text-gray-900">Financial Reports & Profitability Analytics</h1>
          <p className="text-gray-500 text-[11px] mt-0.5">Trip-wise & Month-wise Profit / Loss — Revenue vs Expenses</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-2 px-3 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="p-4 space-y-4">

        {/* ── Global KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total Bookings', value: filteredBookings.length, sub: 'Active reservations', icon: <FileText size={16} />, color: 'blue' },
            { label: 'Total Sales Value', value: formatCurrency(kpi.totalBooked), sub: 'Ticket × Travelers', icon: <DollarSign size={16} />, color: 'indigo' },
            { label: 'Revenue Collected', value: formatCurrency(kpi.totalCollected), sub: `Pending: ${formatCurrency(kpi.totalPending)}`, icon: <Wallet size={16} />, color: 'emerald' },
            { label: 'Total Expenses', value: formatCurrency(kpi.totalExpenses), sub: `${filteredExpenses.length} expense logs`, icon: <TrendingDown size={16} />, color: 'rose' },
            { label: kpi.netProfit >= 0 ? 'Net Profit' : 'Net Loss', value: formatCurrency(kpi.netProfit), sub: 'Revenue - Expenses', icon: kpi.netProfit >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>, color: kpi.netProfit >= 0 ? 'emerald' : 'rose' }
          ].map((card, i) => (
            <div key={i} className={`bg-white p-4 rounded-2xl border shadow-sm border-gray-100`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider text-${card.color}-600`}>{card.label}</span>
                  <h3 className="text-sm font-black text-gray-900 mt-0.5">{card.value}</h3>
                </div>
                <div className={`p-1.5 bg-${card.color}-50 text-${card.color}-600 rounded-xl`}>{card.icon}</div>
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Filter Toolbar ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          {/* Search - full width always */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search trip name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
            />
          </div>

          {/* Dropdowns grid - 2 cols on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Trip Filter */}
            <select
              value={selectedTrip}
              onChange={(e) => { setSelectedTrip(e.target.value); setSelectedDate('all'); }}
              className="bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#00C9B7] cursor-pointer w-full"
            >
              <option value="all">All Trips ({uniqueTripTitles.length})</option>
              {uniqueTripTitles.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Departure Date Filter (only if trip selected) */}
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-sky-50 border border-sky-300 text-sky-900 rounded-xl px-2 py-2 text-xs font-bold focus:outline-none focus:border-[#00C9B7] cursor-pointer w-full"
              disabled={selectedTrip === 'all' || uniqueDates.length === 0}
            >
              <option value="all">{selectedTrip === 'all' ? 'Select Trip First' : 'All Departure Dates'}</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-violet-50 border border-violet-300 text-violet-900 rounded-xl px-2 py-2 text-xs font-bold focus:outline-none focus:border-[#00C9B7] cursor-pointer w-full"
            >
              <option value="all">All Months</option>
              {uniqueMonths.map(mk => (
                <option key={mk} value={mk}>{monthLabel(mk)}</option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => { setSelectedTrip('all'); setSelectedDate('all'); setSelectedMonth('all'); setSearchTerm(''); }}
              className={`flex items-center justify-center gap-1 text-xs font-bold border rounded-xl px-2 py-2 cursor-pointer transition-all ${
                (selectedTrip !== 'all' || selectedDate !== 'all' || selectedMonth !== 'all' || searchTerm)
                  ? 'text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100'
                  : 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <X size={12} /> Clear Filters
            </button>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="bg-white border border-gray-100 rounded-xl p-1 flex gap-1 shadow-sm w-full sm:w-fit">
          <button
            onClick={() => setActiveTab('trip')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'trip' ? 'bg-[#00C9B7] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <MapPin size={13} /> Trip-wise P&L ({tripRows.length})
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'month' ? 'bg-[#00C9B7] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Calendar size={13} /> Month-wise P&L ({monthRows.length})
          </button>
        </div>

        {/* ================================================================
            TAB 1: TRIP-WISE P&L TABLE
        ================================================================ */}
        {activeTab === 'trip' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                Trip-wise Profit & Loss Ledger
              </h3>
              <span className="text-[11px] text-gray-400 font-medium">Revenue Collected − Expenses = Net P/L</span>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-[11px] font-extrabold uppercase tracking-wide border-b border-gray-100 bg-gray-50/30">
                    <th className="px-4 py-3">Trip Package</th>
                    <th className="px-4 py-3 text-center">Bookings / Seats</th>
                    <th className="px-4 py-3 text-center">Passengers Roster</th>
                    <th className="px-4 py-3 text-right text-emerald-600">Revenue Collected</th>
                    <th className="px-4 py-3 text-right text-rose-600">Expenses</th>
                    <th className="px-4 py-3 text-right">Net P/L</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tripRows.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-xs">No records match current filters.</td></tr>
                  )}
                  {tripRows.map((row) => (
                    <tr key={row.title} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors">

                      {/* Trip */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
                          <MapPin size={13} className="text-[#00C9B7]" />
                          {row.title}
                        </div>
                        <div className="text-gray-400 text-[11px] mt-0.5">
                          {selectedDate !== 'all' ? `Departure: ${selectedDate}` : 'All Departures Combined'}
                        </div>
                      </td>

                      {/* Bookings / Seats */}
                      <td className="px-4 py-3 align-middle text-center">
                        <div className="text-xs font-bold text-gray-800">{row.totalPax} Pax ({row.totalBookings} Bookings)</div>
                        <span className={`mt-1 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          row.seatInfo.isFullyBooked
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          <Users size={11} />
                          {row.seatInfo.isFullyBooked ? 'FULL' : `${row.seatInfo.remainingSeats} Left (${row.seatInfo.bookedPassengers}/${row.seatInfo.totalCapacity})`}
                        </span>
                      </td>

                      {/* Passengers Roster Button */}
                      <td className="px-4 py-3 align-middle text-center">
                        <button
                          onClick={() => setPassengerModal({ title: row.title, bookings: row.tripBookings })}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-1 px-2.5 rounded-xl text-[11px] transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <UserCheck size={12} /> {row.tripBookings.length} Customers
                        </button>
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-3 align-middle text-right">
                        <span className="text-xs font-black text-emerald-700">{formatCurrency(row.totalCollected)}</span>
                        <div className="text-[10px] text-gray-400 mt-0.5">Billed: {formatCurrency(row.totalBooked)}</div>
                        {row.pendingDue > 0 && (
                          <div className="text-[10px] text-amber-600 font-bold">Due: {formatCurrency(row.pendingDue)}</div>
                        )}
                      </td>

                      {/* Expenses */}
                      <td className="px-4 py-3 align-middle text-right">
                        <span className="text-xs font-black text-rose-600">{formatCurrency(row.totalExpensesAmt)}</span>
                        <div className="text-[10px] text-gray-400 mt-0.5">{row.tripExpenses.length} Expense Logs</div>
                      </td>

                      {/* Net P/L */}
                      <td className="px-4 py-3 align-middle text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg ${
                          row.isProfit ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {row.isProfit ? '+' : ''}{formatCurrency(row.netPL)}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5">{row.margin}% Margin</div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 align-middle text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            onClick={() => setAuditModal(row)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold py-1 px-2 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Audit
                          </button>
                          <button
                            onClick={() => printTripFinancialReport({ tripTitle: row.title }, {
                              ...row, spotTitle: row.title,
                              bookingsCount: row.totalBookings, travelersCount: row.totalPax,
                              totalBookedValue: row.totalBooked,
                              passengerRevenueCollection: row.totalCollected,
                              pendingReceivables: row.pendingDue,
                              totalExpenses: row.totalExpensesAmt,
                              netProfitLoss: row.netPL,
                              profitMarginPercent: row.margin,
                              scheduleExpenses: row.tripExpenses,
                              scheduleBookings: row.tripBookings
                            })}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold py-1 px-2 rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Printer size={12} /> PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-100">
              {tripRows.map((row) => (
                <div key={row.title} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900 text-xs">{row.title}</div>
                      <div className="text-gray-400 text-[11px]">{row.totalBookings} bookings · {row.totalPax} pax</div>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${row.isProfit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {row.isProfit ? '+' : ''}{formatCurrency(row.netPL)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-emerald-50 rounded-xl p-2">
                      <div className="font-black text-emerald-700">{formatCurrency(row.totalCollected)}</div>
                      <div className="text-gray-500">Collected</div>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-2">
                      <div className="font-black text-rose-600">{formatCurrency(row.totalExpensesAmt)}</div>
                      <div className="text-gray-500">Expenses</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-2">
                      <div className="font-black text-amber-700">{formatCurrency(row.pendingDue)}</div>
                      <div className="text-gray-500">Pending</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPassengerModal({ title: row.title, bookings: row.tripBookings })} className="flex-1 text-center bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold py-1.5 rounded-xl text-[11px] cursor-pointer">
                      👥 {row.tripBookings.length} Customers
                    </button>
                    <button onClick={() => setAuditModal(row)} className="flex-1 text-center bg-sky-50 text-sky-700 border border-sky-200 font-bold py-1.5 rounded-xl text-[11px] cursor-pointer">
                      🔍 Audit
                    </button>
                  </div>
                </div>
              ))}
              {tripRows.length === 0 && <div className="text-center py-8 text-gray-400 text-xs">No records found.</div>}
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 2: MONTH-WISE P&L TABLE
        ================================================================ */}
        {activeTab === 'month' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">Month-wise Profit & Loss Ledger</h3>
              <span className="text-[11px] text-gray-400">Monthly revenue vs expense summary</span>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-[11px] font-extrabold uppercase tracking-wide border-b border-gray-100 bg-gray-50/30">
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3 text-center">Trips / Bookings / Pax</th>
                    <th className="px-4 py-3 text-right text-emerald-600">Revenue Collected</th>
                    <th className="px-4 py-3 text-right text-amber-600">Pending Due</th>
                    <th className="px-4 py-3 text-right text-rose-600">Total Expenses</th>
                    <th className="px-4 py-3 text-right">Net P/L</th>
                    <th className="px-4 py-3 text-center">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRows.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-xs">No records found for selected filters.</td></tr>
                  )}
                  {monthRows.map((row) => (
                    <tr key={row.monthKey} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="font-extrabold text-gray-900 text-xs">{row.label}</div>
                        <div className="text-gray-400 text-[11px]">{row.tripsCount} unique trip{row.tripsCount !== 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-4 py-3 align-middle text-center">
                        <div className="text-xs font-bold text-gray-800">{row.totalBookings} Bookings</div>
                        <div className="text-[11px] text-gray-500">{row.totalPax} Passengers</div>
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <span className="text-xs font-black text-emerald-700">{formatCurrency(row.totalCollected)}</span>
                        <div className="text-[10px] text-gray-400">Billed: {formatCurrency(row.totalBooked)}</div>
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <span className="text-xs font-bold text-amber-700">{formatCurrency(row.pendingDue)}</span>
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <span className="text-xs font-black text-rose-600">{formatCurrency(row.totalExpensesAmt)}</span>
                        <div className="text-[10px] text-gray-400">{row.mExpenses.length} logs</div>
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg ${
                          row.isProfit ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {row.isProfit ? '+' : ''}{formatCurrency(row.netPL)}
                        </span>
                        <div className="text-[10px] text-gray-500 mt-0.5">{row.margin}% Margin</div>
                      </td>
                      <td className="px-4 py-3 align-middle text-center">
                        <button
                          onClick={() => setPassengerModal({ title: row.label, bookings: row.mBookings })}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-1 px-2.5 rounded-xl text-[11px] flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Users size={12} /> {row.mBookings.length} Customers
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-100">
              {monthRows.map((row) => (
                <div key={row.monthKey} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-extrabold text-gray-900 text-xs">{row.label}</div>
                      <div className="text-gray-400 text-[11px]">{row.totalBookings} bookings · {row.totalPax} pax · {row.tripsCount} trips</div>
                    </div>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${row.isProfit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {row.isProfit ? '+' : ''}{formatCurrency(row.netPL)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-emerald-50 rounded-xl p-2">
                      <div className="font-black text-emerald-700">{formatCurrency(row.totalCollected)}</div>
                      <div className="text-gray-500">Collected</div>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-2">
                      <div className="font-black text-rose-600">{formatCurrency(row.totalExpensesAmt)}</div>
                      <div className="text-gray-500">Expenses</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-2">
                      <div className="font-black text-amber-700">{formatCurrency(row.pendingDue)}</div>
                      <div className="text-gray-500">Pending</div>
                    </div>
                  </div>
                  <button onClick={() => setPassengerModal({ title: row.label, bookings: row.mBookings })} className="w-full text-center bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold py-1.5 rounded-xl text-[11px] cursor-pointer">
                    👥 {row.mBookings.length} Customers This Month
                  </button>
                </div>
              ))}
              {monthRows.length === 0 && <div className="text-center py-8 text-gray-400 text-xs">No records found.</div>}
            </div>
          </div>
        )}

        {/* ── Expense Category Breakdown ── */}
        {categoryTotals.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-3">
              Expense Category Breakdown ({filteredExpenses.length} Logs)
            </h3>
            <div className="space-y-2.5">
              {categoryTotals.map(cat => {
                const pct = kpi.totalExpenses > 0 ? ((cat.total / kpi.totalExpenses) * 100).toFixed(1) : 0;
                return (
                  <div key={cat.value}>
                    <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                      <span>{cat.label}</span>
                      <span>{formatCurrency(cat.total)} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#00C9B7] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          PASSENGERS ROSTER MODAL
      ================================================================ */}
      {passengerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">Passengers Roster</h3>
                <p className="text-gray-400 text-[11px] mt-0.5">{passengerModal.title} · {passengerModal.bookings.length} Bookings</p>
              </div>
              <button onClick={() => setPassengerModal(null)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-2.5 max-h-[65vh] overflow-y-auto">
              {passengerModal.bookings.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-xs italic">No passengers registered yet.</div>
              )}
              {passengerModal.bookings.map((b, i) => (
                <div key={b.id || i} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3 flex justify-between items-start text-xs">
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <UserCheck size={13} className="text-[#00C9B7]" /> {b.name}
                      <span className="font-normal text-gray-500">({b.travelers || 1} Pax)</span>
                    </div>
                    <div className="text-gray-500 text-[11px] mt-0.5 flex flex-wrap gap-2">
                      <span className="flex items-center gap-1"><Phone size={10}/> {b.phone}</span>
                      {b.selectedDate && <span>📅 {b.selectedDate}</span>}
                      {b.bookingSource && <span className={`px-1.5 py-0.5 rounded font-bold ${b.bookingSource === 'office' ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-600'}`}>{b.bookingSource === 'office' ? 'Office' : 'Online'}</span>}
                    </div>
                    {b.passengers && b.passengers.length > 0 && (
                      <div className="mt-1 text-[11px] text-gray-500">
                        {b.passengers.map((p, pi) => `${p.name}${p.age ? ` (${p.age})` : ''}`).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-black text-emerald-700 block">{formatCurrency(b.paidAmount || 0)}</span>
                    {((b.amount || 0) - (b.paidAmount || 0)) > 0 && (
                      <span className="text-rose-600 text-[10px] font-bold block">Due: {formatCurrency((b.amount || 0) - (b.paidAmount || 0))}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          AUDIT MODAL (Trip Deep-Dive)
      ================================================================ */}
      {auditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">Financial Audit Report</h3>
                <p className="text-gray-400 text-[11px] mt-0.5">{auditModal.title}</p>
              </div>
              <button onClick={() => setAuditModal(null)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Billed', val: formatCurrency(auditModal.totalBooked), color: 'gray' },
                  { label: 'Revenue Collected', val: formatCurrency(auditModal.totalCollected), color: 'emerald' },
                  { label: 'Pending Due', val: formatCurrency(auditModal.pendingDue), color: 'amber' },
                  { label: 'Total Expenses', val: formatCurrency(auditModal.totalExpensesAmt), color: 'rose' },
                ].map(c => (
                  <div key={c.label} className={`bg-${c.color}-50 border border-${c.color}-200 rounded-2xl p-3 text-center`}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider text-${c.color}-600`}>{c.label}</div>
                    <div className={`font-black text-sm text-${c.color}-800 mt-0.5`}>{c.val}</div>
                  </div>
                ))}
              </div>

              {/* Net P/L Big Banner */}
              <div className={`rounded-2xl p-4 text-center border ${auditModal.isProfit ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Net Profit / Loss</div>
                <div className={`text-2xl font-black mt-1 ${auditModal.isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {auditModal.isProfit ? '+' : ''}{formatCurrency(auditModal.netPL)}
                </div>
                <div className="text-gray-500 text-[11px] mt-0.5">Margin: {auditModal.margin}%</div>
              </div>

              {/* Itemized Expenses */}
              {auditModal.tripExpenses.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Itemized Expenses</h4>
                  <div className="space-y-1.5">
                    {auditModal.tripExpenses.map((exp, i) => (
                      <div key={exp.id || i} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-[10px] uppercase bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded mr-1">
                            {getCategoryLabel(exp.category)}
                          </span>
                          <span className="text-gray-600">{exp.notes || 'Expense'}</span>
                          {exp.date && <span className="text-gray-400 ml-1">({exp.date})</span>}
                        </div>
                        <span className="font-black text-rose-600">{formatCurrency(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={() => printTripFinancialReport({ tripTitle: auditModal.title }, {
                    spotTitle: auditModal.title,
                    bookingsCount: auditModal.totalBookings, travelersCount: auditModal.totalPax,
                    totalBookedValue: auditModal.totalBooked,
                    passengerRevenueCollection: auditModal.totalCollected,
                    pendingReceivables: auditModal.pendingDue,
                    totalExpenses: auditModal.totalExpensesAmt,
                    netProfitLoss: auditModal.netPL,
                    profitMarginPercent: auditModal.margin,
                    isProfit: auditModal.isProfit,
                    scheduleExpenses: auditModal.tripExpenses,
                    scheduleBookings: auditModal.tripBookings
                  })}
                  className="bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer size={14} /> Download PDF Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminReports;
