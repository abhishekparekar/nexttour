import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] selection:bg-[#00C9B7] selection:text-white">
      <Navbar />
      <main className="flex-1 pt-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;

