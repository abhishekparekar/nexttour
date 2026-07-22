import { useState, useEffect } from 'react';
import { subscribeToBookings, subscribeToExpenses, subscribeToSchedules } from '../../firebase';
import { Loader2, TrendingUp, DollarSign, Wallet, FileText, ArrowUpRight, BarChart3, Calendar } from 'lucide-react';

const AdminReports = () => {
  const [bookings, setBookings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState('trips');

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

  // --- Calculations ---

  // 1. Trip Profit Calculations
  const tripReports = schedules.map(schedule => {
    const scheduleBookings = bookings.filter(b => 
      b.scheduleId === schedule.id || 
      (b.tripId === schedule.tripId && b.selectedDate === schedule.departureDate)
    );

    const totalBookingsCount = scheduleBookings.length;
    const totalPersons = scheduleBookings.reduce((sum, b) => sum + (Number(b.travelers) || 0), 0);
    const bookingAmount = scheduleBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalCollection = scheduleBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    const pendingCollection = bookingAmount - totalCollection;

    const totalExpenses = expenses
      .filter(e => e.scheduleId === schedule.id)
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const netProfit = totalCollection - totalExpenses;

    return {
      id: schedule.id,
      title: schedule.tripTitle,
      departureDate: schedule.departureDate,
      totalBookingsCount,
      totalPersons,
      bookingAmount,
      totalCollection,
      pendingCollection,
      totalExpenses,
      netProfit,
      status: schedule.status
    };
  });

  // 2. Global Payment Stats
  const globalTotalBooked = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const globalTotalCollected = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const globalTotalPending = globalTotalBooked - globalTotalCollected;

  const countFullyPaid = bookings.filter(b => b.paymentStatus === 'paid').length;
  const countPartiallyPaid = bookings.filter(b => b.paymentStatus === 'partial').length;
  const countPending = bookings.filter(b => b.paymentStatus === 'pending' || !b.paymentStatus).length;

  // 3. Category Expenses
  const categories = [
    { key: 'vehicle', label: 'Vehicle / Transport' },
    { key: 'hotel', label: 'Hotel / Lodging' },
    { key: 'food', label: 'Food / Catering' },
    { key: 'guide', label: 'Tour Guide Fee' },
    { key: 'fuel', label: 'Fuel / Diesel' },
    { key: 'toll', label: 'Toll / Parking' },
    { key: 'other', label: 'Other Expenses' }
  ];

  const categoryTotals = categories.map(cat => {
    const total = expenses
      .filter(e => e.category === cat.key)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    return { ...cat, total };
  });

  const totalExpenseAmount = categoryTotals.reduce((sum, c) => sum + c.total, 0);

  // --- SVG Chart Renderers ---

  // A. Bar Chart: Trip-wise Collection vs Expense
  const renderTripBarChart = () => {
    const activeTrips = tripReports.filter(t => t.totalCollection > 0 || t.totalExpenses > 0).slice(0, 5);
    if (activeTrips.length === 0) {
      return (
        <div className="text-center py-6 text-gray-400 text-xs italic">
          No trip departure sales recorded yet to render bar graph.
        </div>
      );
    }

    const maxVal = Math.max(...activeTrips.map(t => Math.max(t.totalCollection, t.totalExpenses, 1000)));
    const height = 180;
    const width = 500;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartHeight = height - paddingTop - paddingBottom;
    const chartWidth = width - paddingLeft - paddingRight;
    const barWidth = 14;
    const groupGap = 35;
    const totalGroupWidth = barWidth * 2 + 4;

    return (
      <div className="w-full bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
        <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-4">Trip Profitability comparison (Top 5 departures)</h4>
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[480px]">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const y = paddingTop + chartHeight * (1 - ratio);
              const labelVal = Math.round(maxVal * ratio);
              return (
                <g key={index}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="text-[9px] fill-gray-400 font-bold">
                    ₹{labelVal >= 1000 ? `${(labelVal / 1000).toFixed(0)}k` : labelVal}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {activeTrips.map((trip, idx) => {
              const xCenter = paddingLeft + groupGap + idx * (chartWidth / activeTrips.length);
              
              const colHeight = (trip.totalCollection / maxVal) * chartHeight;
              const expHeight = (trip.totalExpenses / maxVal) * chartHeight;

              const colY = paddingTop + chartHeight - colHeight;
              const expY = paddingTop + chartHeight - expHeight;

              return (
                <g key={trip.id}>
                  {/* Collection Bar */}
                  <rect
                    x={xCenter - barWidth - 2}
                    y={colY}
                    width={barWidth}
                    height={colHeight}
                    fill="url(#greenGrad)"
                    rx="3"
                    title={`Collection: ₹${trip.totalCollection}`}
                  />
                  {/* Expense Bar */}
                  <rect
                    x={xCenter + 2}
                    y={expY}
                    width={barWidth}
                    height={expHeight}
                    fill="url(#redGrad)"
                    rx="3"
                    title={`Expenses: ₹${trip.totalExpenses}`}
                  />
                  {/* Label */}
                  <text
                    x={xCenter}
                    y={height - paddingBottom + 16}
                    textAnchor="middle"
                    className="text-[9px] fill-gray-500 font-bold truncate max-w-[70px]"
                  >
                    {trip.title.length > 8 ? `${trip.title.substring(0, 8)}...` : trip.title}
                  </text>
                  <text
                    x={xCenter}
                    y={height - paddingBottom + 26}
                    textAnchor="middle"
                    className="text-[8px] fill-gray-400 font-semibold"
                  >
                    {trip.departureDate}
                  </text>
                </g>
              );
            })}

            {/* Defs for gradients */}
            <defs>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="flex gap-4 items-center justify-center text-[10px] font-bold text-gray-500 mt-2">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Collections
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Operating Expenses
          </div>
        </div>
      </div>
    );
  };

  // B. Donut Chart: Payments & Receivables Status
  const renderPaymentsDonutChart = () => {
    const totalCount = countFullyPaid + countPartiallyPaid + countPending;
    if (totalCount === 0) return null;

    const r = 36;
    const circumference = 2 * Math.PI * r; // ~226.2

    const pctPaid = countFullyPaid / totalCount;
    const pctPartial = countPartiallyPaid / totalCount;
    const pctPending = countPending / totalCount;

    const strokePaid = pctPaid * circumference;
    const strokePartial = pctPartial * circumference;
    const strokePending = pctPending * circumference;

    const offsetPaid = 0;
    const offsetPartial = circumference - strokePaid;
    const offsetPending = circumference - strokePaid - strokePartial;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
            
            {/* Fully Paid */}
            {strokePaid > 0 && (
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={`${strokePaid} ${circumference}`}
                strokeDashoffset={offsetPaid}
                strokeLinecap="round"
              />
            )}
            
            {/* Partially Paid */}
            {strokePartial > 0 && (
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="12"
                strokeDasharray={`${strokePartial} ${circumference}`}
                strokeDashoffset={offsetPartial}
                strokeLinecap="round"
              />
            )}

            {/* Pending */}
            {strokePending > 0 && (
              <circle
                cx="50"
                cy="50"
                r={r}
                fill="transparent"
                stroke="#ef4444"
                strokeWidth="12"
                strokeDasharray={`${strokePending} ${circumference}`}
                strokeDashoffset={offsetPending}
                strokeLinecap="round"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-gray-950">{totalCount}</span>
            <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Bookings</span>
          </div>
        </div>

        <div className="space-y-2 flex-1 w-full">
          <h4 className="font-bold text-gray-700 text-xs mb-3 text-center sm:text-left">STATUS DISTRIBUTIONS</h4>
          
          <div className="flex items-center justify-between text-xs p-2 border-b border-gray-50">
            <div className="flex items-center gap-2 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Fully Paid
            </div>
            <span className="font-bold text-gray-900">{countFullyPaid} ({Math.round(pctPaid * 100)}%)</span>
          </div>

          <div className="flex items-center justify-between text-xs p-2 border-b border-gray-50">
            <div className="flex items-center gap-2 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Partially Paid
            </div>
            <span className="font-bold text-gray-900">{countPartiallyPaid} ({Math.round(pctPartial * 100)}%)</span>
          </div>

          <div className="flex items-center justify-between text-xs p-2">
            <div className="flex items-center gap-2 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Pending / Unpaid
            </div>
            <span className="font-bold text-gray-900">{countPending} ({Math.round(pctPending * 100)}%)</span>
          </div>
        </div>
      </div>
    );
  };

  // C. Donut Chart: Expense Breakdown
  const renderExpensesDonutChart = () => {
    if (totalExpenseAmount === 0) {
      return (
        <div className="text-center py-12 text-gray-400 text-xs italic">
          No expenses recorded yet.
        </div>
      );
    }

    const r = 36;
    const circumference = 2 * Math.PI * r; // ~226.2
    
    // Sort so slice offsets stack logically
    const validCategories = categoryTotals
      .filter(c => c.total > 0)
      .map(c => ({ ...c, ratio: c.total / totalExpenseAmount }));

    let currentOffset = 0;
    const colors = [
      '#3b82f6', '#6366f1', '#a855f7', 
      '#ec4899', '#f43f5e', '#eab308', '#22c55e'
    ];

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
            
            {validCategories.map((cat, idx) => {
              const strokeVal = cat.ratio * circumference;
              const offset = circumference - currentOffset;
              currentOffset += strokeVal;
              return (
                <circle
                  key={cat.key}
                  cx="50"
                  cy="50"
                  r={r}
                  fill="transparent"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="12"
                  strokeDasharray={`${strokeVal} ${circumference}`}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black text-gray-900 leading-tight">₹{(totalExpenseAmount / 1000).toFixed(1)}k</span>
            <span className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Total spent</span>
          </div>
        </div>

        <div className="space-y-1.5 flex-1 w-full max-h-[180px] overflow-y-auto pr-1">
          {validCategories.map((cat, idx) => (
            <div key={cat.key} className="flex items-center justify-between text-xs p-1.5 border-b border-gray-50/50">
              <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                <span>{cat.label}</span>
              </div>
              <span className="font-bold text-gray-900">₹{cat.total.toLocaleString()} ({Math.round(cat.ratio * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Insights</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time business performance analytics</p>
        </div>
      </div>

      <div className="p-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-2 bg-white p-2 rounded-2xl border">
          <button
            onClick={() => setActiveReportTab('trips')}
            className={`flex-1 sm:flex-initial py-2.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeReportTab === 'trips'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Calendar size={16} /> Trip Profits
          </button>
          <button
            onClick={() => setActiveReportTab('payments')}
            className={`flex-1 sm:flex-initial py-2.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeReportTab === 'payments'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <DollarSign size={16} /> Payments Report
          </button>
          <button
            onClick={() => setActiveReportTab('expenses')}
            className={`flex-1 sm:flex-initial py-2.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeReportTab === 'expenses'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Wallet size={16} /> Expenses Breakdown
          </button>
        </div>

        {/* 1. Trip Profitability Report */}
        {activeReportTab === 'trips' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top comparison bar chart */}
            {renderTripBarChart()}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-[15px]">Departure Summary</h3>
                <span className="text-gray-400 text-xs font-semibold">{tripReports.length} departures mapped</span>
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-200 bg-gray-50/50">
                      <th className="p-4">Package Departure</th>
                      <th className="p-4 text-center">Travellers</th>
                      <th className="p-4 text-right">Collections</th>
                      <th className="p-4 text-right">Expenses</th>
                      <th className="p-4 text-right">Actual Profit</th>
                      <th className="p-4 text-right">Pending Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tripReports.map(report => (
                      <tr key={report.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="p-4 align-middle">
                          <div className="text-gray-900 font-bold text-[13px]">{report.title}</div>
                          <div className="text-gray-400 text-[11px] mt-0.5">{report.departureDate} ({report.status})</div>
                        </td>
                        <td className="p-4 align-middle text-center font-bold text-gray-900 text-xs">
                          {report.totalPersons} ({report.totalBookingsCount} bookings)
                        </td>
                        <td className="p-4 align-middle text-right text-green-600 font-bold text-[13px]">
                          ₹{report.totalCollection?.toLocaleString()}
                        </td>
                        <td className="p-4 align-middle text-right text-red-500 font-bold text-[13px]">
                          ₹{report.totalExpenses?.toLocaleString()}
                        </td>
                        <td className={`p-4 align-middle text-right font-black text-[13px] ${report.netProfit >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                          ₹{report.netProfit?.toLocaleString()}
                        </td>
                        <td className="p-4 align-middle text-right text-gray-500 text-xs">
                          ₹{report.pendingCollection?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-gray-100">
                {tripReports.map(report => (
                  <div key={report.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{report.title}</h4>
                        <p className="text-gray-550 text-[11px] mt-0.5">{report.departureDate} ({report.status})</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${report.netProfit >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        ₹{report.netProfit?.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Group Size:</span>
                        <span className="font-bold text-gray-900">{report.totalPersons} Travelers ({report.totalBookingsCount} bookings)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Collections:</span>
                        <span className="text-green-600 font-semibold">₹{report.totalCollection?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Expenses:</span>
                        <span className="text-red-500 font-semibold">₹{report.totalExpenses?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200/50 pt-1.5 mt-1.5 text-xs font-bold text-gray-800">
                        <span>Receivables:</span>
                        <span>₹{report.pendingCollection?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. Payments Report */}
        {activeReportTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
                <div>
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Sales</div>
                  <div className="text-2xl font-black text-gray-900 mt-1">₹{globalTotalBooked.toLocaleString()}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Collections</div>
                  <div className="text-2xl font-black text-green-600 mt-1">₹{globalTotalCollected.toLocaleString()}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center">
                  <Wallet size={24} />
                </div>
                <div>
                  <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pending Receivables</div>
                  <div className="text-2xl font-black text-red-600 mt-1">₹{globalTotalPending.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Donut Chart visual breakdown */}
            {renderPaymentsDonutChart()}
          </div>
        )}

        {/* 3. Expense Report */}
        {activeReportTab === 'expenses' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Expense Category Analysis</h3>
                  <p className="text-gray-500 text-xs mt-0.5 font-medium">Summary of expenses by group</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 uppercase tracking-wider block font-bold">Total Expenditure</span>
                  <span className="text-2xl font-black text-red-650">₹{totalExpenseAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Expense Donut visual block */}
              {renderExpensesDonutChart()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
