import { useState, useEffect } from 'react';
import { NavLink, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Mountain, 
  Calendar, 
  Users, 
  Image, 
  Star, 
  ChevronLeft,
  ChevronRight,
  Download,
  LogOut,
  Truck,
  UserCheck,
  Clock,
  CreditCard,
  AlertTriangle,
  BarChart3,
  Menu
} from 'lucide-react';
import AdminLogin from './Login';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen, onLogout }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/trips', icon: Mountain, label: 'Tour Packages' },
    { path: '/admin/schedules', icon: Clock, label: 'Trips / Schedule' },
    { path: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { path: '/admin/pending-payments', icon: AlertTriangle, label: 'Pending Payments' },
    { path: '/admin/customers', icon: Users, label: 'Customers' },
    { path: '/admin/vehicles', icon: Truck, label: 'Vehicles' },
    { path: '/admin/drivers', icon: UserCheck, label: 'Drivers' },
    { path: '/admin/expenses', icon: Download, label: 'Trip Expenses' },
    { path: '/admin/leads', icon: Download, label: 'PDF Leads' },
    { path: '/admin/categories', icon: Star, label: 'Categories' },
    { path: '/admin/testimonials', icon: Users, label: 'Testimonials' },
    { path: '/admin/gallery', icon: Image, label: 'Gallery' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' }
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50 transition-all duration-300 flex flex-col ${
        collapsed ? 'md:w-20' : 'md:w-64'
      } ${
        mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img 
            src="/nexttour.jpeg" 
            alt="NextTour Logo" 
            className={`object-contain transition-all ${collapsed && !mobileOpen ? 'h-7 w-7 rounded-lg' : 'h-8 w-auto'}`} 
          />
          {(!collapsed || mobileOpen) && (
            <div>
              <h1 className="text-gray-900 font-bold text-sm leading-none">NextTour</h1>
              <p className="text-gray-500 text-[10px] mt-0.5">Admin Panel</p>
            </div>
          )}
        </div>
        <button 
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              } ${collapsed && !mobileOpen ? 'md:justify-center' : ''}`}
              title={collapsed && !mobileOpen ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(!collapsed || mobileOpen) && <span className="font-medium text-sm">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-200 space-y-1">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 font-semibold rounded-xl transition-colors ${
            collapsed && !mobileOpen ? 'md:justify-center' : ''
          }`}
          title={collapsed && !mobileOpen ? "Sign Out" : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {(!collapsed || mobileOpen) && <span className="text-sm">Sign Out</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden md:flex w-full items-center gap-3 px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-sm font-medium">Collapse</span>}
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
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4 md:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Mountain className="w-5 h-5 text-primary-500" />
            <span className="font-bold text-gray-900 text-sm">NextTour Admin</span>
          </div>
        </div>
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
        className={`transition-all duration-300 pt-16 md:pt-0 ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        } ml-0`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
