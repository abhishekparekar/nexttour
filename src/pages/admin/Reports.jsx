import { useState, useEffect, useMemo } from 'react';
import { subscribeToBookings, subscribeToExpenses, subscribeToSchedules } from '../../firebase';
import { useCachedTrips } from '../../firebaseCache';
import { calculateTripFinances, formatCurrency, exportToCSV, EXPENSE_CATEGORIES, getCategoryLabel, calculateTripSeatAvailability } from '../../utils/bookingUtils';
import { printTripFinancialReport } from '../../utils/printTemplates';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Wallet, FileText, Calendar, Download, Printer, Search, X, Eye, MapPin, Users, Phone, UserCheck } from 'lucide-react';

const AdminReports = () => {
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tourPackages, setTourPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState('trips');

  // Filter States
  const [selectedSpotFilter, setSelectedSpotFilter] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [dateRangePreset, setDateRangePreset] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuditTrip, setSelectedAuditTrip] = useState(null);
  const [showPassengerModal, setShowPassengerModal] = useState(null);

  useEffect(() => {
    const unsubBookings = subscribeToBookings((data) => setBookings(data || []));
    const unsubExpenses = subscribeToExpenses((data) => setExpenses(data || []));
    const unsubSchedules = subscribeToSchedules((data) => setSchedules(data || []));
    const unsubTrips = useCachedTrips((data) => {
      setTourPackages(data || []);
      setLoading(false);
    });

    return () => {
      unsubBookings();
      unsubExpenses();
      unsubSchedules();
      unsubTrips();
    };
  }, []);

  // Filter by date range preset (All Time, This Month, Last Month)
  const filterByPreset = (dateString) => {
    if (dateRangePreset === 'all' || !dateString) return true;
    const itemDate = new Date(dateString);
    const now = new Date();
    
    if (dateRangePreset === 'this_month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (dateRangePreset === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear();
    }
    return true;
  };

  const filteredBookings = useMemo(() => bookings.filter(b => filterByPreset(b.createdAt || b.selectedDate)), [bookings, dateRangePreset]);
  const filteredExpenses = useMemo(() => expenses.filter(e => filterByPreset(e.date || e.createdAt)), [expenses, dateRangePreset]);

  // Extract unique Tour / Spot Titles (No Repetition)
  const uniqueTourSpots = useMemo(() => {
    const spots = new Set();
    tourPackages.forEach(t => { if (t.title || t.name) spots.add(t.title || t.name); });
    schedules.forEach(s => { if (s.tripTitle || s.title) spots.add(s.tripTitle || s.title); });
    bookings.forEach(b => { if (b.tripName) spots.add(b.tripName); });
    return Array.from(spots).sort();
  }, [tourPackages, schedules, bookings]);

  // Extract unique Departure Dates for filtering
  const uniqueDepartureDates = useMemo(() => {
    const dates = new Set();
    schedules.forEach(s => { if (s.departureDate) dates.add(s.departureDate); });
    bookings.forEach(b => { if (b.selectedDate) dates.add(b.selectedDate); });
    expenses.forEach(e => { if (e.date) dates.add(e.date); });
    return Array.from(dates).filter(Boolean).sort();
  }, [schedules, bookings, expenses]);

  // Group & Aggregate Profitability per Unique Tour Spot (Non-Repeated)
  const spotReports = useMemo(() => {
    return uniqueTourSpots
      .filter(spotTitle => selectedSpotFilter === 'all' || spotTitle === selectedSpotFilter)
      .map(spotTitle => {
        const titleLower = spotTitle.toLowerCase();

        // Find matching schedule for capacity
        const scheduleObj = schedules.find(s => {
          const sTitle = (s.tripTitle || s.title || '').toLowerCase();
          return sTitle.includes(titleLower) || titleLower.includes(sTitle);
        });

        // Match bookings for this spot & selected date
        const spotBookings = filteredBookings.filter(b => {
          const bTitle = (b.tripName || '').toLowerCase();
          const matchesSpot = bTitle.includes(titleLower) || titleLower.includes(bTitle);
          const matchesDate = selectedDateFilter === 'all' || b.selectedDate === selectedDateFilter;
          return matchesSpot && matchesDate;
        });

        // Match expenses for this spot & selected date
        const spotExpenses = filteredExpenses.filter(e => {
          const eTitle = (e.tripTitle || '').toLowerCase();
          const matchesSpot = eTitle.includes(titleLower) || titleLower.includes(eTitle);
          const matchesDate = selectedDateFilter === 'all' || e.date === selectedDateFilter;
          return matchesSpot && matchesDate;
        });

        const seatInfo = calculateTripSeatAvailability(scheduleObj || { tripTitle: spotTitle, capacity: 15 }, spotBookings);

        const bookingsCount = spotBookings.length;
        const travelersCount = spotBookings.reduce((sum, b) => sum + (Number(b.travelers) || 1), 0);
        const totalBookedValue = spotBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
        const passengerRevenueCollection = spotBookings.reduce((sum, b) => sum + (Number(b.paidAmount) || 0), 0);
        const pendingReceivables = totalBookedValue - passengerRevenueCollection;
        const totalExpenses = spotExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        const netProfitLoss = passengerRevenueCollection - totalExpenses;
        const isProfit = netProfitLoss >= 0;
        const profitMarginPercent = passengerRevenueCollection > 0 
          ? ((netProfitLoss / passengerRevenueCollection) * 100).toFixed(1)
          : 0;

        return {
          spotTitle,
          seatInfo,
          finances: {
            spotTitle,
            departureDate: selectedDateFilter === 'all' ? 'All Departures' : selectedDateFilter,
            bookingsCount,
            travelersCount,
            totalBookedValue,
            passengerRevenueCollection,
            pendingReceivables,
            totalExpenses,
            netProfitLoss,
            isProfit,
            profitMarginPercent,
            scheduleExpenses: spotExpenses,
            scheduleBookings: spotBookings
          }
        };
      })
      .filter(item => {
        const q = searchTerm.toLowerCase();
        return item.spotTitle.toLowerCase().includes(q);
      });
  }, [uniqueTourSpots, selectedSpotFilter, selectedDateFilter, filteredBookings, filteredExpenses, schedules, searchTerm]);

  // Global Financial Statistics
  const globalTotalBooked = filteredBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const globalTotalCollected = filteredBookings.reduce((sum, b) => sum + (Number(b.paidAmount) || 0), 0);
  const globalTotalPending = Math.max(0, globalTotalBooked - globalTotalCollected);
  const globalTotalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const globalNetProfit = globalTotalCollected - globalTotalExpenses;
  const globalIsProfit = globalNetProfit >= 0;

  // Category Expenses Breakdown
  const categoryTotals = EXPENSE_CATEGORIES.map(cat => {
    const total = filteredExpenses
      .filter(e => e.category === cat.value)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { ...cat, total };
  });

  // Export CSV Report Handlers
  const handleExportTripReportCSV = () => {
    const rows = spotReports.map(({ spotTitle, finances, seatInfo }) => ({
      'Tour Spot / Package': spotTitle,
      'Departure Date Filter': finances.departureDate,
      'Total Bookings': finances.bookingsCount,
      'Passengers Count': finances.travelersCount,
      'Remaining Seats': seatInfo.remainingSeats,
      'Total Booked Value (INR)': finances.totalBookedValue,
      'Revenue Collected (INR)': finances.passengerRevenueCollection,
      'Pending Receivables (INR)': finances.pendingReceivables,
      'Total Expenses (INR)': finances.totalExpenses,
      'Net Profit/Loss (INR)': finances.netProfitLoss,
      'Profit Margin (%)': `${finances.profitMarginPercent}%`,
      'Status': finances.isProfit ? 'PROFIT' : 'LOSS'
    }));

    const headers = [
      'Tour Spot / Package',
      'Departure Date Filter',
      'Total Bookings',
      'Passengers Count',
      'Remaining Seats',
      'Total Booked Value (INR)',
      'Revenue Collected (INR)',
      'Pending Receivables (INR)',
      'Total Expenses (INR)',
      'Net Profit/Loss (INR)',
      'Profit Margin (%)',
      'Status'
    ];

    exportToCSV(`NextTour_Spot_Profitability_Report_${Date.now()}.csv`, rows, headers);
  };

  const handleExportExpensesCSV = () => {
    const rows = filteredExpenses.map(e => ({
      'Expense ID': e.id,
      'Trip Title': e.tripTitle,
      'Category': getCategoryLabel(e.category),
      'Date': e.date,
      'Amount (INR)': e.amount,
      'Notes': e.notes || ''
    }));

    const headers = ['Expense ID', 'Trip Title', 'Category', 'Date', 'Amount (INR)', 'Notes'];
    exportToCSV(`NextTour_Expenses_Report_${Date.now()}.csv`, rows, headers);
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
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">Financial Reports & Profitability Analytics</h1>
          <p className="text-gray-600 text-xs mt-0.5">Clear Profit & Loss Audit by Trip, Seats, Passengers & Expenses</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateRangePreset}
            onChange={(e) => setDateRangePreset(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-[#00C9B7] cursor-pointer"
          >
            <option value="all">Preset: All Time</option>
            <option value="this_month">Preset: This Month</option>
            <option value="last_month">Preset: Last Month</option>
          </select>

          <button
            onClick={activeReportTab === 'trips' ? handleExportTripReportCSV : handleExportExpensesCSV}
            className="flex items-center gap-1.5 bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-1.5 px-3 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            <Download size={14} /> Export CSV Report
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Global Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Total Sales Booked</span>
                <h3 className="text-base font-black text-gray-900 mt-1">{formatCurrency(globalTotalBooked)}</h3>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <FileText size={18} />
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">{filteredBookings.length} Total Reservations</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Revenue Collected</span>
                <h3 className="text-base font-black text-emerald-700 mt-1">{formatCurrency(globalTotalCollected)}</h3>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Wallet size={18} />
              </div>
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-2">Due Pending: {formatCurrency(globalTotalPending)}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">Total Trip Expenses</span>
                <h3 className="text-base font-black text-rose-700 mt-1">{formatCurrency(globalTotalExpenses)}</h3>
              </div>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <DollarSign size={18} />
              </div>
            </div>
            <p className="text-[11px] text-rose-600 font-semibold mt-2">Diesel, Water, Medical, Tickets...</p>
          </div>

          <div className={`p-4 rounded-2xl border shadow-sm ${
            globalIsProfit ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600">
                  {globalIsProfit ? 'Net Business Profit' : 'Net Business Loss'}
                </span>
                <h3 className={`text-base font-black mt-1 ${globalIsProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(globalNetProfit)}
                </h3>
              </div>
              <div className={`p-2 rounded-xl ${globalIsProfit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {globalIsProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              </div>
            </div>
            <p className="text-[11px] font-bold text-gray-600 mt-2">
              Revenue Collected - Trip Expenses
            </p>
          </div>
        </div>

        {/* Filters Toolbar: Tour Spot Selector + Departure Date Selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tour spot name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
              />
            </div>

            {/* Unique Spot Filter (No Repetition) */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap hidden sm:inline">Tour Spot:</span>
              <select
                value={selectedSpotFilter}
                onChange={(e) => setSelectedSpotFilter(e.target.value)}
                className="w-full sm:w-auto bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#00C9B7] cursor-pointer"
              >
                <option value="all">All Tour Spots ({uniqueTourSpots.length} Unique Packages)</option>
                {uniqueTourSpots.map(spot => (
                  <option key={spot} value={spot}>{spot}</option>
                ))}
              </select>
            </div>

            {/* Dedicated Date Filter Button / Dropdown */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <span className="text-xs font-bold text-gray-500 whitespace-nowrap flex items-center gap-1">
                <Calendar size={13} className="text-[#00C9B7]" /> Departure Date:
              </span>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="w-full sm:w-auto bg-sky-50 border border-sky-300 text-sky-900 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#00C9B7] cursor-pointer shadow-xs"
              >
                <option value="all">All Departure Dates</option>
                {uniqueDepartureDates.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border border-gray-100 rounded-xl p-1 flex gap-1 w-fit shadow-xs">
          <button
            onClick={() => setActiveReportTab('trips')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeReportTab === 'trips' ? 'bg-[#00C9B7] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Trip Profitability Ledger ({spotReports.length} Spots)
          </button>
          <button
            onClick={() => setActiveReportTab('expenses')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeReportTab === 'expenses' ? 'bg-[#00C9B7] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Expense Breakdown By Category
          </button>
        </div>

        {/* TAB 1: Unique Spot Profitability Table (Sequential Flow: Trip -- Bookings / Seats -- Passengers -- Expenses -- Profit/Loss) */}
        {activeReportTab === 'trips' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">Trip & Departure Profit/Loss Ledger</h3>
              <span className="text-[11px] text-gray-500 font-medium">Revenue Collected - Itemized Expenses = Net Profit/Loss</span>
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-600 text-xs font-bold uppercase tracking-wide border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-3">Trip / Package</th>
                    <th className="px-4 py-3 text-center">Total Bookings / Seats Capacity</th>
                    <th className="px-4 py-3 text-center">Passengers History</th>
                    <th className="px-4 py-3 text-right text-emerald-700">Revenue Collection</th>
                    <th className="px-4 py-3 text-right text-rose-600">Trip Expenses</th>
                    <th className="px-4 py-3 text-right">Net Profit / Loss</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {spotReports.map(({ spotTitle, finances, seatInfo }) => (
                    <tr key={spotTitle} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                      {/* 1. Trip & Departure Date */}
                      <td className="px-4 py-3 align-middle font-bold text-gray-900 text-xs">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-[#00C9B7]" />
                          {spotTitle}
                        </div>
                        <div className="text-gray-500 text-[11px] mt-0.5">Date: {finances.departureDate}</div>
                      </td>

                      {/* 2. Total Bookings / Seats Capacity */}
                      <td className="px-4 py-3 align-middle text-center">
                        <div className="text-xs font-bold text-gray-800">
                          {finances.travelersCount} Pax ({finances.bookingsCount} Bookings)
                        </div>
                        <span className={`mt-1 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          seatInfo.isFullyBooked 
                            ? 'bg-rose-50 text-rose-700 border-rose-200 font-black' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          <Users size={11} />
                          {seatInfo.isFullyBooked ? 'FULL (0 Left)' : `${seatInfo.remainingSeats} Seats Left (${seatInfo.bookedPassengers}/${seatInfo.totalCapacity})`}
                        </span>
                      </td>

                      {/* 3. Passengers History Roster Button */}
                      <td className="px-4 py-3 align-middle text-center">
                        <button
                          onClick={() => setShowPassengerModal({ spotTitle, bookings: finances.scheduleBookings })}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-1 px-2.5 rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <UserCheck size={13} /> {finances.scheduleBookings.length} Customers Roster
                        </button>
                      </td>

                      {/* 4. Revenue Collection */}
                      <td className="px-4 py-3 align-middle text-right text-xs font-black text-emerald-700">
                        {formatCurrency(finances.passengerRevenueCollection)}
                        <div className="text-[10px] text-gray-400 font-normal">Booked: {formatCurrency(finances.totalBookedValue)}</div>
                      </td>

                      {/* 5. Trip Expenses */}
                      <td className="px-4 py-3 align-middle text-right text-xs font-black text-rose-600">
                        {formatCurrency(finances.totalExpenses)}
                        <div className="text-[10px] text-gray-400 font-normal">{finances.scheduleExpenses.length} Expense Logs</div>
                      </td>

                      {/* 6. Net Profit / Loss */}
                      <td className="px-4 py-3 align-middle text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg ${
                          finances.isProfit 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {finances.isProfit ? '+' : ''}{formatCurrency(finances.netProfitLoss)}
                        </span>
                        <div className="text-[10px] text-gray-500 font-semibold mt-0.5">{finances.profitMarginPercent}% Margin</div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 align-middle text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedAuditTrip({ trip: { tripTitle: spotTitle, departureDate: finances.departureDate }, finances })}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold py-1 px-2.5 rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                            title="View Deep Audit Breakdown"
                          >
                            <Eye size={12} /> Audit
                          </button>
                          <button
                            onClick={() => printTripFinancialReport({ tripTitle: spotTitle, departureDate: finances.departureDate }, finances)}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold py-1 px-2.5 rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                            title="Download PDF Report"
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
          </div>
        )}

        {/* TAB 2: Expense Categories Breakdown */}
        {activeReportTab === 'expenses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-3">Expenses Distribution By Category</h3>
              <div className="space-y-3">
                {categoryTotals.map(cat => {
                  const percentage = globalTotalExpenses > 0 ? ((cat.total / globalTotalExpenses) * 100).toFixed(1) : 0;
                  return (
                    <div key={cat.value} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-800">
                        <span>{cat.label}</span>
                        <span>{formatCurrency(cat.total)} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#00C9B7] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">Accounting Rules & Formula Reference</h3>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-700 space-y-2">
                <div className="font-bold text-gray-900">1. Trip Profit Formula:</div>
                <div className="font-mono bg-white p-2 rounded border border-gray-200 text-green-700 font-bold">
                  Net Profit = Passenger Revenue Collected - Total Trip Expenses
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Passengers History Roster Modal */}
      {showPassengerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Passengers Roster & History</h3>
                <p className="text-gray-500 text-xs">{showPassengerModal.spotTitle}</p>
              </div>
              <button onClick={() => setShowPassengerModal(null)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
              {showPassengerModal.bookings.map(b => (
                <div key={b.id} className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      <UserCheck size={14} className="text-[#00C9B7]" />
                      {b.name} ({b.travelers || 1} Pax)
                    </div>
                    <div className="text-gray-500 text-[11px] mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1"><Phone size={11} /> {b.phone}</span>
                      <span>&bull; Date: {b.selectedDate || 'Active'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-emerald-700 text-xs block">{formatCurrency(b.paidAmount)} Paid</span>
                    {b.amount - b.paidAmount > 0 && (
                      <span className="text-rose-600 text-[10px] font-bold block">Pending: {formatCurrency(b.amount - b.paidAmount)}</span>
                    )}
                  </div>
                </div>
              ))}

              {showPassengerModal.bookings.length === 0 && (
                <div className="text-center py-6 text-gray-400 italic">
                  No passenger history registered for this spot yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deep Audit Modal for a Selected Trip */}
      {selectedAuditTrip && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Tour Spot Financial Audit Report</h3>
                <p className="text-gray-500 text-xs">{selectedAuditTrip.trip.tripTitle} ({selectedAuditTrip.finances.departureDate})</p>
              </div>
              <button onClick={() => setSelectedAuditTrip(null)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Financial KPI Summary */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-gray-50 border border-gray-150 p-3 rounded-2xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Booked Value</span>
                  <span className="font-black text-gray-900 text-sm block mt-0.5">{formatCurrency(selectedAuditTrip.finances.totalBookedValue)}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Revenue Collected</span>
                  <span className="font-black text-emerald-700 text-sm block mt-0.5">{formatCurrency(selectedAuditTrip.finances.passengerRevenueCollection)}</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl">
                  <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Trip Expenses</span>
                  <span className="font-black text-rose-700 text-sm block mt-0.5">{formatCurrency(selectedAuditTrip.finances.totalExpenses)}</span>
                </div>
                <div className={`border p-3 rounded-2xl ${
                  selectedAuditTrip.finances.isProfit ? 'bg-emerald-100/60 border-emerald-300' : 'bg-rose-100/60 border-rose-300'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Net Profit / Loss</span>
                  <span className={`font-black text-sm block mt-0.5 ${
                    selectedAuditTrip.finances.isProfit ? 'text-emerald-800' : 'text-rose-800'
                  }`}>
                    {selectedAuditTrip.finances.isProfit ? '+' : ''}{formatCurrency(selectedAuditTrip.finances.netProfitLoss)}
                  </span>
                </div>
              </div>

              {/* Itemized Expenses List */}
              <div>
                <h4 className="font-extrabold uppercase tracking-wider text-gray-400 text-[10px] mb-1.5">Itemized Trip Expenses</h4>
                <div className="space-y-1.5">
                  {selectedAuditTrip.finances.scheduleExpenses.map(exp => (
                    <div key={exp.id} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-gray-800 uppercase text-[10px] bg-slate-200 px-1.5 py-0.5 rounded mr-1">
                          {getCategoryLabel(exp.category)}
                        </span>
                        <span className="text-gray-600 text-xs">{exp.notes || 'Expense logged'}</span>
                      </div>
                      <span className="font-black text-rose-600 text-xs">{formatCurrency(exp.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-150 flex justify-end gap-2">
                <button
                  onClick={() => printTripFinancialReport(selectedAuditTrip.trip, selectedAuditTrip.finances)}
                  className="bg-[#00C9B7] hover:bg-[#00b3a3] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Printer size={14} /> Download PDF Profit Report
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
