import { useState, useEffect } from 'react';
import { subscribeToBookings, subscribeToExpenses, subscribeToSchedules } from '../../firebase';
import { calculateTripFinances, formatCurrency, exportToCSV, EXPENSE_CATEGORIES, getCategoryLabel } from '../../utils/bookingUtils';
import { printTripFinancialReport } from '../../utils/printTemplates';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Wallet, FileText, ArrowUpRight, BarChart3, Calendar, Download, Printer, Filter } from 'lucide-react';

const AdminReports = () => {
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState('trips');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    const unsubBookings = subscribeToBookings((data) => setBookings(data));
    const unsubExpenses = subscribeToExpenses((data) => setExpenses(data));
    const unsubSchedules = subscribeToSchedules((data) => {
      setSchedules(data);
      setLoading(false);
    });

    return () => {
      unsubBookings();
      unsubExpenses();
      unsubSchedules();
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

  const filteredBookings = bookings.filter(b => filterByDate(b.createdAt || b.selectedDate));
  const filteredExpenses = expenses.filter(e => filterByDate(e.date || e.createdAt));
  const filteredSchedules = schedules.filter(s => filterByDate(s.departureDate));

  // 1. Trip Profitability Calculations per schedule
  const tripReports = filteredSchedules.map(schedule => {
    return {
      schedule,
      finances: calculateTripFinances(schedule, filteredBookings, filteredExpenses)
    };
  }).filter(item => item.finances !== null);

  // Global Financial Statistics
  const globalTotalBooked = filteredBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const globalTotalCollected = filteredBookings.reduce((sum, b) => sum + (Number(b.paidAmount) || 0), 0);
  const globalTotalPending = globalTotalBooked - globalTotalCollected;
  const globalTotalExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const globalNetProfit = globalTotalCollected - globalTotalExpenses;
  const globalIsProfit = globalNetProfit >= 0;

  const countFullyPaid = filteredBookings.filter(b => b.paymentStatus === 'paid').length;
  const countPartiallyPaid = filteredBookings.filter(b => b.paymentStatus === 'partial').length;
  const countPending = filteredBookings.filter(b => b.paymentStatus === 'pending' || !b.paymentStatus).length;

  // Category Expenses Breakdown
  const categoryTotals = EXPENSE_CATEGORIES.map(cat => {
    const total = filteredExpenses
      .filter(e => e.category === cat.value)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { ...cat, total };
  });

  // Export CSV Report Handlers
  const handleExportTripReportCSV = () => {
    const rows = tripReports.map(({ schedule, finances }) => ({
      'Schedule ID': schedule.id,
      'Trip Title': schedule.tripTitle,
      'Departure Date': schedule.departureDate,
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
      'Schedule ID',
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
          <p className="text-gray-600 text-xs mt-0.5">Comprehensive audit of trip revenues, expenses, collections, and net profit/loss</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-[#00C9B7] cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
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

        {/* Tab Navigation */}
        <div className="bg-white border border-gray-100 rounded-xl p-1 flex gap-1 w-fit shadow-xs">
          <button
            onClick={() => setActiveReportTab('trips')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeReportTab === 'trips' ? 'bg-[#00C9B7] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Trip Profitability Ledger ({tripReports.length} Departures)
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

        {/* TAB 1: Trip Profitability Table */}
        {activeReportTab === 'trips' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">Trip-Wise Revenue vs Expense Audit Ledger</h3>
              <span className="text-[11px] text-gray-500 font-medium">Passenger Collections - Expenses = Profit / Loss</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-600 text-xs font-bold uppercase tracking-wide border-b border-gray-200 bg-gray-50/50">
                    <th className="px-4 py-3">Trip Departure</th>
                    <th className="px-4 py-3 text-center">Travelers</th>
                    <th className="px-4 py-3 text-right">Booked Value</th>
                    <th className="px-4 py-3 text-right text-emerald-700">Revenue Collection</th>
                    <th className="px-4 py-3 text-right text-rose-600">Trip Expenses</th>
                    <th className="px-4 py-3 text-right">Net Profit / Loss</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tripReports.map(({ schedule, finances }) => (
                    <tr key={schedule.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <div className="font-bold text-gray-900 text-xs">{schedule.tripTitle}</div>
                        <div className="text-gray-500 text-[11px] flex items-center gap-1">
                          <Calendar size={11} /> Departure: {schedule.departureDate}
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
                        <button
                          onClick={() => printTripFinancialReport(schedule, finances)}
                          className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 font-bold py-1 px-2.5 rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
                        >
                          <Printer size={12} /> Audit PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {tripReports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h4 className="text-gray-700 font-bold text-xs">No departure trip reports found</h4>
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
    </div>
  );
};

export default AdminReports;
