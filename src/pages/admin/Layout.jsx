import { useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, MapPin, Calendar, Users, Image,
  ChevronLeft, ChevronRight, FileDown, LogOut, Truck,
  UserCheck, Clock, CreditCard, AlertCircle, BarChart3,
  Menu, X, MessageSquare, Tags, Receipt, Settings, Info, PhoneCall, Layers, DollarSign, Globe
} from 'lucide-react';
import AdminLogin from './Login';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen, onLogout }) => {
  const location = useLocation();

  // Workflow Groups: Step-by-Step operational menu structure
  const workflowGroups = [
    {
      groupTitle: 'OVERVIEW',
      stepBadge: '',
      items: [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true }
      ]
    },
    {
      groupTitle: 'STEP 1: TOUR & FLEET SETUP',
      stepBadge: '1',
      items: [
        { path: '/admin/trips', icon: MapPin, label: '1. Tour Packages' },
        { path: '/admin/schedules', icon: Clock, label: '2. Trip Schedules' },
        { path: '/admin/categories', icon: Tags, label: '3. Categories' },
        { path: '/admin/vehicles', icon: Truck, label: '4. Vehicles / Fleet' },
        { path: '/admin/drivers', icon: UserCheck, label: '5. Drivers & Guides' }
      ]
    },
    {
      groupTitle: 'STEP 2: BOOKINGS & FRONT OFFICE',
      stepBadge: '2',
      items: [
        { path: '/admin/bookings', icon: Calendar, label: '1. Reservations & Office' },
        { path: '/admin/payments', icon: CreditCard, label: '2. Balance Collection' },
        { path: '/admin/pending-payments', icon: AlertCircle, label: '3. Pending Dues' },
        { path: '/admin/leads', icon: FileDown, label: '4. Customer Leads' },
        { path: '/admin/inquiries', icon: MessageSquare, label: '5. Web Inquiries' },
        { path: '/admin/customers', icon: Users, label: '6. Customer Directory' }
      ]
    },
    {
      groupTitle: 'STEP 3: EXPENSES & PROFIT AUDIT',
      stepBadge: '3',
      items: [
        { path: '/admin/expenses', icon: Receipt, label: '1. Trip Expenses (Diesel, Water...)' },
        { path: '/admin/reports', icon: BarChart3, label: '2. Profit / Loss Reports' }
      ]
    },
    {
      groupTitle: 'STEP 4: WEBSITE & CMS',
      stepBadge: '4',
      items: [
        { path: '/admin/testimonials', icon: MessageSquare, label: '1. Testimonials' },
        { path: '/admin/gallery', icon: Image, label: '2. Photo Gallery' },
        { path: '/admin/footer', icon: Settings, label: '3. Footer Settings' },
        { path: '/admin/about', icon: Info, label: '4. About Page' },
        { path: '/admin/contact', icon: PhoneCall, label: '5. Contact Info' }
      ]
    }
  ];

  const isCollapsed = collapsed && !mobileOpen;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50 transition-all duration-300 flex flex-col shadow-sm ${
        collapsed ? 'md:w-16' : 'md:w-64'
      } ${
        mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'
      }`}
    >
      {/* Logo Header */}
      <div className={`h-16 flex items-center border-b border-gray-100 flex-shrink-0 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
        {isCollapsed ? (
          <img src="/nexttour.jpeg" alt="NextTour" className="h-8 w-8 object-contain rounded-md" />
        ) : (
          <>
            <img src="/nexttour.jpeg" alt="NextTour" className="h-10 w-auto object-contain rounded-md max-h-11" />
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto overflow-x-hidden">
        {workflowGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-2.5 pt-1 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  {group.groupTitle}
                </span>
                {group.stepBadge && (
                  <span className="text-[9px] font-extrabold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    Step {group.stepBadge}
                  </span>
                )}
              </div>
            )}

            {group.items.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.exact}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-xs font-bold ${
                    isActive
                      ? 'bg-[#00C9B7] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'md:justify-center md:px-2' : ''}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" style={{ minWidth: '16px' }} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="py-2 px-2 border-t border-gray-100 space-y-1 flex-shrink-0 bg-gray-50/50">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-2 px-2.5 py-2 text-rose-600 hover:bg-rose-50 font-bold rounded-xl transition-colors text-xs cursor-pointer ${
            isCollapsed ? 'md:justify-center md:px-2' : ''
          }`}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={15} className="flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden md:flex w-full items-center gap-2 px-2.5 py-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors text-xs font-bold cursor-pointer ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="ml-1">Collapse Menu</span></>}
        </button>
      </div>
    </aside>
  );
};

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('adminLoggedIn') === 'true' || sessionStorage.getItem('adminLoggedIn') === 'true';
  });

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminLoggedIn');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-12 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-3 md:hidden shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={18} />
          </button>
          <img src="/nexttour.jpeg" alt="NextTour" className="h-6 w-auto object-contain" />
        </div>
        <span className="text-xs font-bold text-gray-500">Admin Operations</span>
      </header>

      {/* Backdrop for Mobile Sidebar */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        ></div>
      )}

      {/* Sidebar Component */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        onLogout={handleLogout} 
      />
      
      {/* Main Content Area */}
      <main
        className={`transition-all duration-300 pt-12 md:pt-0 ${
          collapsed ? 'md:ml-16' : 'md:ml-64'
        } ml-0 min-h-screen admin-panel-content`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
