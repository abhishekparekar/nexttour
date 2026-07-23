import { useState, useEffect, useMemo } from 'react';
import { subscribeToBookings, subscribeToExpenses, subscribeToSchedules } from '../../firebase';
import { useCachedTrips } from '../../firebaseCache';
import { calculateTripFinances, formatCurrency, exportToCSV, EXPENSE_CATEGORIES, getCategoryLabel } from '../../utils/bookingUtils';
import { printTripFinancialReport } from '../../utils/printTemplates';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Wallet, FileText, ArrowUpRight, BarChart3, Calendar, Download, Printer, Filter, Search, X, CheckCircle, AlertCircle, Eye } from 'lucide-react';

const AdminReports = () => {
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [tourPackages, setTourPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState('trips');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTripFilter, setSelectedTripFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuditTrip, setSelectedAuditTrip] = useState(null);

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

  // Filter items by date range if needed
  const filterByDate = (dateString) => {
    if (dateFilter === 'all' || !dateString) return true;
    const itemDate = new Date(dateString);
    const now = new Date();
    
    if (dateFilter === 'this_month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'last_month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear();
    }
    return true;
  };

  const filteredBookings = useMemo(() => bookings.filter(b => filterByDate(b.createdAt || b.selectedDate)), [bookings, dateFilter]);
  const filteredExpenses = useMemo(() => expenses.filter(e => filterByDate(e.date || e.createdAt)), [expenses, dateFilter]);
  const filteredSchedules = useMemo(() => schedules.filter(s => filterByDate(s.departureDate)), [schedules, dateFilter]);

  // Unified Trips List combining Schedules + Tour Packages + Customer Booked Trips
  const unifiedTripsList = useMemo(() => {
    const map = new Map();

    // 1. Schedules
    filteredSchedules.forEach(s => {
      const id = String(s.id);
      map.set(id, {
        id: s.id,
        tripId: s.tripId || s.id,
        tripTitle: s.tripTitle || s.title || 'Tour Departure',
        departureDate: s.departureDate || s.date || 'Active Departure'
      });
    });

    // 2. Tour Packages
    tourPackages.forEach(t => {
      const id = `TRIP_${t.id}`;
      if (!map.has(id)) {
        map.set(id, {
          id: id,
          tripId: t.id,
          tripTitle: t.title || t.name || 'Tour Package',
          departureDate: (t.upcomingDates && t.upcomingDates[0]) || 'All Departures'
        });
      }
    });

    // 3. Customer Booked Trips
    filteredBookings.forEach(b => {
      if (b.tripName) {
        const id = b.scheduleId || `BOOKING_TRIP_${b.tripId || b.tripName}`;
        if (!map.has(id)) {
          map.set(id, {
            id: id,
            tripId: b.tripId || id,
            tripTitle: b.tripName,
            departureDate: b.selectedDate || 'Booked Departure'
          });
        }
      }
    });

    return Array.from(map.values());
  }, [filteredSchedules, tourPackages, filteredBookings]);

  // 1. Dynamic Trip Profitability Calculations for all trips
  const tripReports = useMemo(() => {
    return unifiedTripsList
      .filter(trip => selectedTripFilter === 'all' || String(trip.id) === String(selectedTripFilter))
      .map(trip => {
        const finances = calculateTripFinances(trip, filteredBookings, filteredExpenses);
        return {
          trip,
          finances
        };
      })
      .filter(item => item.finances !== null)
      .filter(item => {
        const q = searchTerm.toLowerCase();
        return (
          item.trip.tripTitle?.toLowerCase().includes(q) ||
          item.trip.departureDate?.toLowerCase().includes(q)
        );
      });
  }, [unifiedTripsList, filteredBookings, filteredExpenses, searchTerm, selectedTripFilter]);

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
    const rows = tripReports.map(({ trip, finances }) => ({
      'Trip Title': trip.tripTitle,
      'Departure Date': trip.departureDate,
      'Total Bookings': finances.bookingsCount,
      'Passengers Count': finances.travelersCount,
      'Total Booked Value (INR)': finances.totalBookedValue,
      'Revenue Collected (INR)': finances.passengerRevenueCollection,
      'Pending Receivables (INR)': finances.pendingReceivables,
      'Total Expenses (INR)': finances.totalExpenses,
      'Net Profit/Loss (INR)': finances.netProfitLoss,
      'Profit Margin (%)': `${finances.profitMarginPercent}%`,
      'Status': finances.isProfit ? 'PROFIT' : 'LOSS'
    }));

    const headers = [
      'Trip Title',
      'Departure Date',
      'Total Bookings',
      'Passengers Count',
      'Total Booked Value (INR)',
      'Revenue Collected (INR)',
      'Pending Receivables (INR)',
      'Total Expenses (INR)',
      'Net Profit/Loss (INR)',
      'Profit Margin (%)',
      'Status'
    ];

    exportToCSV(`NextTour_Trip_Profitability_Report_${Date.now()}.csv`, rows, headers);
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
          <p className="text-gray-600 text-xs mt-0.5">Live dynamic audit of trip revenues, passenger collections, expenses, and net profit/loss</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-[#00C9B7] cursor-pointer"
          >
            <option value="all">Filter: All Time</option>
            <option value="this_month">Filter: This Month</option>
            <option value="last_month">Filter: Last Month</option>
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
              Formula: Revenue Collected - Trip Expenses
            </p>
          </div>
        </div>

        {/* Search, Trip Filter & Tab Navigation */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col lg:flex-row justify-between items-center gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports by trip name or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#00C9B7]"
              />
            </div>

            <select
              value={selectedTripFilter}
              onChange={(e) => setSelectedTripFilter(e.target.value)}
              className="w-full sm:w-auto bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#00C9B7] cursor-pointer"
            >
              <option value="all">Filter: All Trips ({unifiedTripsList.length})</option>
              {unifiedTripsList.map(t => (
                <option key={t.id} value={t.id}>{t.tripTitle} ({t.departureDate})</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-100 border border-gray-200 rounded-xl p-1 flex gap-1 shadow-xs">
            <button
              onClick={() => setActiveReportTab('trips')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeReportTab === 'trips' ? 'bg-[#00C9B7] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Trip Profitability Ledger ({tripReports.length} Trips)
            </button>
            <button
              onClick={() => setActiveReportTab('expenses')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeReportTab === 'expenses' ? 'bg-[#00C9B7] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Expense Categories Breakdown
            </button>
          </div>
        </div>

        {/* TAB 1: Trip Profitability Table */}
        {activeReportTab === 'trips' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">Trip-Wise Revenue vs Expense Audit Ledger</h3>
              <span className="text-[11px] text-gray-500 font-medium">Passenger Collections - Expenses = Profit / Loss</span>
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-600 text-xs font-bold uppercase tracking-wide border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-3">Trip Departure</th>
                    <th className="px-4 py-3 text-center">Travelers / Bookings</th>
                    <th className="px-4 py-3 text-right">Total Booked Value</th>
                    <th className="px-4 py-3 text-right text-emerald-700">Revenue Collection</th>
                    <th className="px-4 py-3 text-right text-rose-600">Total Expenses</th>
                    <th className="px-4 py-3 text-right">Net Profit / Loss</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tripReports.map(({ trip, finances }) => (
                    <tr key={trip.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="font-bold text-gray-900 text-xs">{trip.tripTitle}</div>
                        <div className="text-gray-500 text-[11px] flex items-center gap-1">
                          <Calendar size={11} /> Departure: {trip.departureDate}
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle text-center text-xs font-bold text-gray-800">
                        {finances.travelersCount} Pax ({finances.bookingsCount} Bks)
                      </td>

                      <td className="px-4 py-3 align-middle text-right text-xs font-bold text-gray-700">
                        {formatCurrency(finances.totalBookedValue)}
                      </td>

                      <td className="px-4 py-3 align-middle text-right text-xs font-black text-emerald-700">
                        {formatCurrency(finances.passengerRevenueCollection)}
                      </td>

                      <td className="px-4 py-3 align-middle text-right text-xs font-black text-rose-600">
                        {formatCurrency(finances.totalExpenses)}
                      </td>

                      <td className="px-4 py-3 align-middle text-right">
                        <span className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg ${
                          finances.isProfit 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {finances.isProfit ? '+' : ''}{formatCurrency(finances.netProfitLoss)}
                        </span>
                      </td>

                      <td className="px-4 py-3 align-middle text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedAuditTrip({ trip, finances })}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold py-1 px-2.5 rounded-lg text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                            title="View Deep Audit Breakdown"
                          >
                            <Eye size={12} /> Audit
                          </button>
                          <button
                            onClick={() => printTripFinancialReport(trip, finances)}
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

            {/* Mobile View */}
            <div className="block lg:hidden divide-y divide-gray-100">
              {tripReports.map(({ trip, finances }) => (
                <div key={trip.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{trip.tripTitle}</h4>
                      <p className="text-gray-500 text-[11px]">Departure: {trip.departureDate}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                      finances.isProfit 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {finances.isProfit ? '+' : ''}{formatCurrency(finances.netProfitLoss)}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1 border border-gray-100">
                    <div className="flex justify-between"><span className="text-gray-500">Travelers Count:</span><span className="font-bold">{finances.travelersCount} Pax ({finances.bookingsCount} Bks)</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total Booked Value:</span><span className="font-bold">{formatCurrency(finances.totalBookedValue)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Revenue Collection:</span><span className="text-emerald-700 font-black">{formatCurrency(finances.passengerRevenueCollection)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Trip Expenses:</span><span className="text-rose-600 font-black">{formatCurrency(finances.totalExpenses)}</span></div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setSelectedAuditTrip({ trip, finances })}
                      className="flex-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1"
                    >
                      <Eye size={13} /> Deep Audit
                    </button>
                    <button
                      onClick={() => printTripFinancialReport(trip, finances)}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1"
                    >
                      <Printer size={13} /> PDF Report
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {tripReports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h4 className="text-gray-700 font-bold text-xs">No trip profitability records found</h4>
              </div>
            )}
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
                <div className="text-[11px] text-gray-500">
                  Note: Total Booked value represents expected revenue. Net Profit is calculated strictly on actual collected cash/online payments received from travelers.
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-700 space-y-2">
                <div className="font-bold text-gray-900">2. Tracked Expense Categories:</div>
                <ul className="list-disc list-inside text-gray-600 text-[11px] space-y-1">
                  <li><strong>Diesel & Petrol:</strong> Vehicle fuel expenses logged for the trip.</li>
                  <li><strong>Water & Medical:</strong> Mineral water crates, first-aid oxygen, emergency supplies.</li>
                  <li><strong>Tickets & Permits:</strong> Entry passes, permit fees, monument tickets.</li>
                  <li><strong>Transport & Guide:</strong> Vehicle rental costs, driver allowances, guide fees.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deep Audit Modal for a Selected Trip */}
      {selectedAuditTrip && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Trip Financial Audit Report</h3>
                <p className="text-gray-500 text-xs">{selectedAuditTrip.trip.tripTitle} ({selectedAuditTrip.trip.departureDate})</p>
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

                  {selectedAuditTrip.finances.scheduleExpenses.length === 0 && (
                    <div className="text-gray-400 italic text-center py-3 bg-gray-50 rounded-xl border border-gray-100">
                      No expenses logged for this trip yet.
                    </div>
                  )}
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
