import { useState } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, MapPin, Calendar, Users, Image,
  ChevronLeft, ChevronRight, FileDown, LogOut, Truck,
  UserCheck, Clock, CreditCard, AlertCircle, BarChart3,
  Menu, X, MessageSquare, Tags, Receipt, Settings, Info, PhoneCall
} from 'lucide-react';
import AdminLogin from './Login';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen, onLogout }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/trips', icon: MapPin, label: 'Tour Packages' },
    { path: '/admin/schedules', icon: Clock, label: 'Trips / Schedule' },
    { path: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { path: '/admin/pending-payments', icon: AlertCircle, label: 'Pending Payments' },
    { path: '/admin/customers', icon: Users, label: 'Customers' },
    { path: '/admin/vehicles', icon: Truck, label: 'Vehicles' },
    { path: '/admin/drivers', icon: UserCheck, label: 'Drivers' },
    { path: '/admin/expenses', icon: Receipt, label: 'Trip Expenses' },
    { path: '/admin/leads', icon: FileDown, label: 'PDF Leads' },
    { path: '/admin/inquiries', icon: MessageSquare, label: 'Contact Inquiries' },
    { path: '/admin/categories', icon: Tags, label: 'Categories' },
    { path: '/admin/testimonials', icon: MessageSquare, label: 'Testimonials' },
    { path: '/admin/gallery', icon: Image, label: 'Gallery' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { path: '/admin/footer', icon: Settings, label: 'Footer Settings' },
    { path: '/admin/about', icon: Info, label: 'About Page' },
    { path: '/admin/contact', icon: PhoneCall, label: 'Contact Settings' }
  ];

  const isCollapsed = collapsed && !mobileOpen;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50 transition-all duration-300 flex flex-col shadow-sm ${
        collapsed ? 'md:w-16' : 'md:w-56'
      } ${
        mobileOpen ? 'w-56 translate-x-0' : 'w-56 -translate-x-full md:translate-x-0'
      }`}
    >
      {/* Logo Header */}
      <div className={`h-12 flex items-center border-b border-gray-100 flex-shrink-0 ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'}`}>
        {isCollapsed ? (
          <img src="/nexttour.jpeg" alt="NextTour" className="h-7 w-7 object-contain rounded-md" />
        ) : (
          <>
            <img src="/nexttour.jpeg" alt="NextTour" className="h-7 w-auto object-contain rounded-md max-w-[120px]" />
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg transition-all text-xs font-semibold ${
                isActive
                  ? 'bg-[#00C9B7] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              } ${isCollapsed ? 'md:justify-center md:px-2' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" style={{minWidth:'16px'}} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="py-2 px-2 border-t border-gray-100 space-y-0.5 flex-shrink-0">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-red-500 hover:bg-red-50 font-medium rounded-lg transition-colors text-xs ${
            isCollapsed ? 'md:justify-center md:px-2' : ''
          }`}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={15} className="flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden md:flex w-full items-center gap-2.5 px-2.5 py-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-xs ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span className="ml-1">Collapse</span></>}
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
        <span className="text-xs font-semibold text-gray-400">Admin Panel</span>
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
          collapsed ? 'md:ml-16' : 'md:ml-56'
        } ml-0 min-h-screen admin-panel-content`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
